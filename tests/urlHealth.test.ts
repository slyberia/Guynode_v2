import test from 'node:test';
import assert from 'node:assert';
import {
  classifyHttpStatus,
  formatVerificationDate,
  sha256,
  isRealChecksum,
  shouldSkipChecksumForSize,
  checkUrlHealth,
  MinimalResponse,
} from '../utils/urlHealth.js';

// Build a mock response.
const resp = (
  status: number,
  headers: Record<string, string> = {},
  body?: Uint8Array
): MinimalResponse => ({
  status,
  url: 'https://example.com/file',
  headers: { get: (k: string) => headers[k.toLowerCase()] ?? null },
  arrayBuffer: async () => (body ? body.buffer.slice(body.byteOffset, body.byteOffset + body.byteLength) : new ArrayBuffer(0)),
});

test('classifyHttpStatus', () => {
  assert.strictEqual(classifyHttpStatus(200), 'available');
  assert.strictEqual(classifyHttpStatus(206), 'available');
  assert.strictEqual(classifyHttpStatus(302), 'available');
  assert.strictEqual(classifyHttpStatus(401), 'forbidden');
  assert.strictEqual(classifyHttpStatus(403), 'forbidden');
  assert.strictEqual(classifyHttpStatus(404), 'not-found');
  assert.strictEqual(classifyHttpStatus(410), 'not-found');
  assert.strictEqual(classifyHttpStatus(500), 'broken');
  assert.strictEqual(classifyHttpStatus(418), 'broken');
});

test('formatVerificationDate is YYYY-MM-DD', () => {
  const out = formatVerificationDate(new Date('2026-06-22T17:00:00Z'));
  assert.strictEqual(out, '2026-06-22');
  assert.match(formatVerificationDate(), /^\d{4}-\d{2}-\d{2}$/);
});

test('sha256 and placeholder rejection', () => {
  const a = sha256(Buffer.from('hello'));
  assert.match(a, /^sha256:[0-9a-f]{64}$/);
  assert.strictEqual(isRealChecksum(a), true);
  assert.strictEqual(isRealChecksum(undefined), false);
  assert.strictEqual(isRealChecksum(''), false);
  assert.strictEqual(isRealChecksum('sha256:0000000000000000'), false); // all-same
  assert.strictEqual(isRealChecksum('placeholder'), false);
  assert.strictEqual(isRealChecksum('TODO'), false);
});

test('shouldSkipChecksumForSize', () => {
  assert.strictEqual(shouldSkipChecksumForSize(100, 1000), false);
  assert.strictEqual(shouldSkipChecksumForSize(2000, 1000), true);
  assert.strictEqual(shouldSkipChecksumForSize(null, 1000), false);
});

test('checkUrlHealth — HEAD success', async () => {
  const fetchImpl = async () => resp(200, { 'content-type': 'application/pdf', 'content-length': '39910' });
  const r = await checkUrlHealth('https://example.com/file', { fetchImpl });
  assert.strictEqual(r.status, 'available');
  assert.strictEqual(r.method, 'HEAD');
  assert.strictEqual(r.contentType, 'application/pdf');
  assert.strictEqual(r.contentLength, 39910);
});

test('checkUrlHealth — HEAD 405 falls back to ranged GET', async () => {
  const calls: string[] = [];
  const fetchImpl = async (_url: string, init?: { method?: string; headers?: Record<string, string> }) => {
    calls.push(init?.method ?? 'GET');
    if (init?.method === 'HEAD') return resp(405);
    assert.strictEqual(init?.headers?.Range, 'bytes=0-0');
    return resp(206, { 'content-length': '1' });
  };
  const r = await checkUrlHealth('https://example.com/file', { fetchImpl });
  assert.deepStrictEqual(calls, ['HEAD', 'GET']);
  assert.strictEqual(r.status, 'available');
  assert.strictEqual(r.method, 'GET');
});

test('checkUrlHealth — HEAD throws falls back to GET', async () => {
  const fetchImpl = async (_url: string, init?: { method?: string }) => {
    if (init?.method === 'HEAD') throw new Error('HEAD not allowed');
    return resp(200, { 'content-length': '10' });
  };
  const r = await checkUrlHealth('https://example.com/file', { fetchImpl });
  assert.strictEqual(r.status, 'available');
  assert.strictEqual(r.method, 'GET');
});

test('checkUrlHealth — forbidden', async () => {
  const fetchImpl = async () => resp(403);
  const r = await checkUrlHealth('https://example.com/file', { fetchImpl });
  assert.strictEqual(r.status, 'forbidden');
});

test('checkUrlHealth — total network failure is unknown', async () => {
  const fetchImpl = async () => {
    throw new Error('ENOTFOUND');
  };
  const r = await checkUrlHealth('https://example.com/file', { fetchImpl });
  assert.strictEqual(r.status, 'unknown');
  assert.strictEqual(r.method, 'none');
  assert.match(r.error ?? '', /ENOTFOUND/);
});

test('checkUrlHealth — checksum generated for small reachable file', async () => {
  const body = Buffer.from('the quick brown fox');
  const fetchImpl = async (_url: string, init?: { method?: string }) => {
    if (init?.method === 'HEAD') return resp(200, { 'content-length': String(body.length) });
    return resp(200, { 'content-length': String(body.length) }, body);
  };
  const r = await checkUrlHealth('https://example.com/file', { fetchImpl, generateChecksum: true });
  assert.strictEqual(r.checksumStatus, 'generated');
  assert.strictEqual(r.checksum, sha256(body));
});

test('checkUrlHealth — checksum skipped for large file', async () => {
  const fetchImpl = async () => resp(200, { 'content-length': String(100 * 1024 * 1024) });
  const r = await checkUrlHealth('https://example.com/file', {
    fetchImpl,
    generateChecksum: true,
    maxChecksumBytes: 1024,
  });
  assert.strictEqual(r.checksumStatus, 'skipped-large-file');
  assert.strictEqual(r.checksum, undefined);
});
