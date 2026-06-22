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
  | 'generated' // self-computed SHA-256
  | 'verified-via-origin-hash' // origin (e.g. GCS) MD5/CRC32C captured, no download needed
  | 'skipped-large-file' // no SHA-256 self-computed (over size cap) AND no origin hash
  | 'skipped-not-fetched'
  | 'unavailable'
  | 'unknown';

// Where a recorded checksum came from.
export type ChecksumSource = 'self-sha256' | 'origin-md5' | 'origin-crc32c';

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
  // Canonical checksum: prefer self-computed "sha256:<hex>", else origin "md5:<hex>" / "crc32c:<base64>".
  checksum?: string;
  checksumStatus?: ChecksumStatus;
  checksumSource?: ChecksumSource;
  // Raw integrity hashes advertised by the origin store (captured free from headers).
  originMd5?: string; // "md5:<hex>"
  originCrc32c?: string; // "crc32c:<base64>"
  etag?: string;
}

// Minimal response shape so a mock fetch can satisfy the orchestrator.
export interface MinimalResponse {
  ok?: boolean;
  status: number;
  url?: string;
  headers: { get(name: string): string | null };
  arrayBuffer?: () => Promise<ArrayBuffer>;
  // Real fetch responses expose a ReadableStream body (async-iterable in Node),
  // enabling constant-memory streaming. Mocks may omit it and supply arrayBuffer.
  body?: AsyncIterable<Uint8Array> | null;
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

// Parse a GCS-style `x-goog-hash` header, e.g.
//   "crc32c=mCNKJg==,md5=zudh+1BDbFRcl0ondtPfrQ=="
// MD5 is returned as hex (canonical); CRC32C is kept as the base64 GCS reports.
export const parseGoogHash = (header: string | null | undefined): { md5Hex?: string; crc32cBase64?: string } => {
  const out: { md5Hex?: string; crc32cBase64?: string } = {};
  if (!header) return out;
  for (const part of header.split(',')) {
    const trimmed = part.trim();
    const eq = trimmed.indexOf('=');
    if (eq < 0) continue;
    const key = trimmed.slice(0, eq);
    const value = trimmed.slice(eq + 1); // base64 may itself contain '='
    if (key === 'md5') out.md5Hex = Buffer.from(value, 'base64').toString('hex');
    else if (key === 'crc32c') out.crc32cBase64 = value;
  }
  return out;
};

// A bare 32-hex ETag (GCS non-composite objects) is the MD5 hex.
const etagAsMd5Hex = (etag: string | null | undefined): string | undefined => {
  if (!etag) return undefined;
  const v = etag.replace(/"/g, '').toLowerCase();
  return /^[0-9a-f]{32}$/.test(v) ? v : undefined;
};

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

  const fromResponse = (res: MinimalResponse, method: 'HEAD' | 'GET'): UrlHealthResult => {
    const goog = parseGoogHash(res.headers.get('x-goog-hash'));
    const etag = res.headers.get('etag') ?? undefined;
    const md5Hex = goog.md5Hex ?? etagAsMd5Hex(etag);
    return {
      url,
      finalUrl: res.url && res.url !== url ? res.url : undefined,
      status: classifyHttpStatus(res.status),
      httpStatus: res.status,
      method,
      contentType: res.headers.get('content-type'),
      contentLength: parseLength(res.headers.get('content-length')),
      corsAllowOrigin: res.headers.get('access-control-allow-origin'),
      checkedAt,
      originMd5: md5Hex ? `md5:${md5Hex}` : undefined,
      originCrc32c: goog.crc32cBase64 ? `crc32c:${goog.crc32cBase64}` : undefined,
      etag,
    };
  };

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
    result = { ...result, ...(await generateChecksum(url, result, fetchImpl, maxBytes)) };
  }

  return result;
};

type ChecksumOutcome = Pick<UrlHealthResult, 'checksum' | 'checksumStatus' | 'checksumSource'>;

// Use the integrity hash the origin store already advertises (free, any size).
const originHashFallback = (health: UrlHealthResult): ChecksumOutcome | null => {
  if (health.originMd5) {
    return { checksum: health.originMd5, checksumStatus: 'verified-via-origin-hash', checksumSource: 'origin-md5' };
  }
  if (health.originCrc32c) {
    return { checksum: health.originCrc32c, checksumStatus: 'verified-via-origin-hash', checksumSource: 'origin-crc32c' };
  }
  return null;
};

// Stream the response body into a SHA-256 hash with constant memory, aborting if
// the running byte count exceeds maxBytes (protects against unknown-length giants
// that send no/incorrect Content-Length). Falls back to arrayBuffer() for mocks.
const streamSha256 = async (
  res: MinimalResponse,
  maxBytes: number,
  abort: AbortController
): Promise<ChecksumOutcome> => {
  const hash = createHash('sha256');

  if (res.body && typeof (res.body as AsyncIterable<Uint8Array>)[Symbol.asyncIterator] === 'function') {
    let bytes = 0;
    for await (const chunk of res.body as AsyncIterable<Uint8Array>) {
      bytes += chunk.byteLength;
      if (bytes > maxBytes) {
        try { abort.abort(); } catch { /* noop */ }
        return { checksumStatus: 'skipped-large-file' };
      }
      hash.update(chunk);
    }
    return { checksum: `sha256:${hash.digest('hex')}`, checksumStatus: 'generated', checksumSource: 'self-sha256' };
  }

  if (res.arrayBuffer) {
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.byteLength > maxBytes) return { checksumStatus: 'skipped-large-file' };
    hash.update(buf);
    return { checksum: `sha256:${hash.digest('hex')}`, checksumStatus: 'generated', checksumSource: 'self-sha256' };
  }

  return { checksumStatus: 'unavailable' };
};

// Layered checksum strategy:
//  1. If a self-computed SHA-256 is feasible (under the size cap), stream it.
//  2. Otherwise (over cap, or fetch/stream fails), fall back to the origin's
//     advertised MD5/CRC32C — a real integrity hash captured for free.
//  3. Only when neither is available is the file genuinely skipped/unavailable.
const generateChecksum = async (
  url: string,
  health: UrlHealthResult,
  fetchImpl: FetchLike,
  maxBytes: number
): Promise<ChecksumOutcome> => {
  // Known to be over the cap by header — don't download; prefer the origin hash.
  if (shouldSkipChecksumForSize(health.contentLength, maxBytes)) {
    return originHashFallback(health) ?? { checksumStatus: 'skipped-large-file' };
  }

  const abort = new AbortController();
  try {
    const res = await fetchImpl(url, { method: 'GET', redirect: 'follow', signal: abort.signal });
    if (classifyHttpStatus(res.status) !== 'available') {
      return originHashFallback(health) ?? { checksumStatus: 'unavailable' };
    }
    const streamed = await streamSha256(res, maxBytes, abort);
    // Unknown-length giant that overflowed mid-stream: prefer the origin hash.
    if (streamed.checksumStatus === 'skipped-large-file') {
      return originHashFallback(health) ?? streamed;
    }
    return streamed;
  } catch {
    return originHashFallback(health) ?? { checksumStatus: 'unavailable' };
  }
};
