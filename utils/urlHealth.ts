// Server-side URL health + checksum helpers (Prompt 1.5A).
//
// Pure / dependency-injected so it is testable without real network access:
// the orchestrator (checkUrlHealth) takes an injectable `fetchImpl`.
// Used by scripts/check-dataset-links.ts.
//
// URL health is user-facing (downloads, previews, developer endpoints).
// Checksums are admin/developer-facing (file integrity, migration QA, provenance).
// See docs/GUYNODE_PORTAL_IMPLEMENTATION_SEQUENCE.md.

import { createHash } from 'crypto';

// Classification of a single URL's reachability.
export type UrlHealthStatus =
  | 'available'
  | 'broken'
  | 'forbidden'
  | 'not-found'
  | 'cors-limited'
  | 'unknown'
  | 'skipped';

// Outcome of attempting to checksum a file.
export type ChecksumStatus =
  | 'generated'
  | 'skipped-large-file'
  | 'skipped-not-fetched'
  | 'unavailable'
  | 'unknown';

export interface UrlHealthResult {
  url: string;
  finalUrl?: string;
  status: UrlHealthStatus;
  httpStatus: number | null;
  method: 'HEAD' | 'GET' | 'none';
  contentType?: string | null;
  contentLength?: number | null;
  // Value of the Access-Control-Allow-Origin header, if any (browser-readability hint).
  corsAllowOrigin?: string | null;
  error?: string;
  checkedAt: string; // YYYY-MM-DD
  checksum?: string; // "sha256:<hex>" only when genuinely computed
  checksumStatus?: ChecksumStatus;
}

// Minimal response shape so a mock fetch can satisfy the orchestrator.
export interface MinimalResponse {
  ok?: boolean;
  status: number;
  url?: string;
  headers: { get(name: string): string | null };
  arrayBuffer?: () => Promise<ArrayBuffer>;
}
export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; redirect?: string; signal?: AbortSignal }
) => Promise<MinimalResponse>;

export const DEFAULT_MAX_CHECKSUM_BYTES = 50 * 1024 * 1024; // 50 MB
export const DEFAULT_TIMEOUT_MS = 15000;

/** YYYY-MM-DD in UTC. */
export const formatVerificationDate = (d: Date = new Date()): string =>
  d.toISOString().slice(0, 10);

/** Map an HTTP status code to a health classification. */
export const classifyHttpStatus = (status: number): UrlHealthStatus => {
  if (status >= 200 && status < 400) return 'available'; // includes 206 + followed redirects
  if (status === 401 || status === 403) return 'forbidden';
  if (status === 404 || status === 410) return 'not-found';
  if (status >= 400) return 'broken';
  return 'unknown';
};

/** SHA-256 of a buffer, returned as "sha256:<hex>". */
export const sha256 = (data: Buffer | Uint8Array): string =>
  'sha256:' + createHash('sha256').update(data).digest('hex');

/** True if a real checksum string (not empty / not a placeholder). */
export const isRealChecksum = (value: string | undefined | null): boolean => {
  if (!value) return false;
  const v = value.trim().toLowerCase();
  if (!v) return false;
  if (v.includes('placeholder') || v.includes('todo') || v.includes('xxxx')) return false;
  const hex = v.replace(/^sha256:|^md5:|^sha1:/, '');
  if (hex.length < 8) return false;
  if (/^(.)\1+$/.test(hex)) return false; // all-same-char
  return true;
};

export const shouldSkipChecksumForSize = (
  contentLength: number | null | undefined,
  maxBytes: number = DEFAULT_MAX_CHECKSUM_BYTES
): boolean => typeof contentLength === 'number' && contentLength > maxBytes;

const parseLength = (raw: string | null): number | null => {
  if (raw == null) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
};

export interface CheckOptions {
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  generateChecksum?: boolean;
  maxChecksumBytes?: number;
  now?: () => Date;
}

const timeoutSignal = (ms: number): AbortSignal | undefined => {
  try {
    return AbortSignal.timeout(ms);
  } catch {
    return undefined;
  }
};

/**
 * Check a single http(s) URL:
 *  1. Try HEAD.
 *  2. If HEAD errors or returns a method-not-allowed-ish status, fall back to a
 *     ranged GET (Range: bytes=0-0).
 *  3. Optionally generate a SHA-256 checksum (full GET, size-gated).
 */
export const checkUrlHealth = async (
  url: string,
  opts: CheckOptions = {}
): Promise<UrlHealthResult> => {
  const fetchImpl = (opts.fetchImpl ?? (globalThis.fetch as unknown as FetchLike));
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT_MS;
  const maxBytes = opts.maxChecksumBytes ?? DEFAULT_MAX_CHECKSUM_BYTES;
  const checkedAt = formatVerificationDate(opts.now ? opts.now() : new Date());

  const fromResponse = (res: MinimalResponse, method: 'HEAD' | 'GET'): UrlHealthResult => ({
    url,
    finalUrl: res.url && res.url !== url ? res.url : undefined,
    status: classifyHttpStatus(res.status),
    httpStatus: res.status,
    method,
    contentType: res.headers.get('content-type'),
    contentLength: parseLength(res.headers.get('content-length')),
    corsAllowOrigin: res.headers.get('access-control-allow-origin'),
    checkedAt,
  });

  let result: UrlHealthResult | null = null;

  // 1. HEAD
  try {
    const head = await fetchImpl(url, { method: 'HEAD', redirect: 'follow', signal: timeoutSignal(timeoutMs) });
    // 405/501 => server doesn't support HEAD; fall through to GET.
    if (head.status !== 405 && head.status !== 501) {
      result = fromResponse(head, 'HEAD');
    }
  } catch (err) {
    result = null; // try GET fallback below
    if (err instanceof Error) result = null;
  }

  // 2. Ranged GET fallback
  if (!result) {
    try {
      const get = await fetchImpl(url, {
        method: 'GET',
        headers: { Range: 'bytes=0-0' },
        redirect: 'follow',
        signal: timeoutSignal(timeoutMs),
      });
      result = fromResponse(get, 'GET');
    } catch (err) {
      return {
        url,
        status: 'unknown',
        httpStatus: null,
        method: 'none',
        error: err instanceof Error ? err.message : String(err),
        checkedAt,
      };
    }
  }

  // 3. Optional checksum (only for reachable files).
  if (opts.generateChecksum && result.status === 'available') {
    result = { ...result, ...(await generateChecksum(url, result, fetchImpl, maxBytes, timeoutMs)) };
  }

  return result;
};

const generateChecksum = async (
  url: string,
  health: UrlHealthResult,
  fetchImpl: FetchLike,
  maxBytes: number,
  timeoutMs: number
): Promise<{ checksum?: string; checksumStatus: ChecksumStatus }> => {
  if (shouldSkipChecksumForSize(health.contentLength, maxBytes)) {
    return { checksumStatus: 'skipped-large-file' };
  }
  try {
    const res = await fetchImpl(url, { method: 'GET', redirect: 'follow', signal: timeoutSignal(timeoutMs) });
    if (!res.arrayBuffer || classifyHttpStatus(res.status) !== 'available') {
      return { checksumStatus: 'unavailable' };
    }
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) {
      return { checksumStatus: 'skipped-large-file' };
    }
    return { checksum: sha256(buf), checksumStatus: 'generated' };
  } catch {
    return { checksumStatus: 'unavailable' };
  }
};
