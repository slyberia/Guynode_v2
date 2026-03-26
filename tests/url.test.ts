import test from 'node:test';
import assert from 'node:assert';
import { safeUrl } from '../utils/url.js';

test('safeUrl', async (t) => {
  // Capture console.error to keep test output clean and verify error behavior
  const originalConsoleError = console.error;
  let lastError = '';
  console.error = (msg: string, ...args: unknown[]) => {
    lastError = `${msg} ${args.join(' ')}`.trim();
  };

  t.afterEach(() => {
    lastError = '';
  });

  t.after(() => {
    console.error = originalConsoleError;
  });

  await t.test('returns valid HTTP url', () => {
    const url = 'http://example.com/test';
    assert.strictEqual(safeUrl(url), url);
  });

  await t.test('returns valid HTTPS url', () => {
    const url = 'https://example.com/test/page.html';
    assert.strictEqual(safeUrl(url), url);
  });

  await t.test('returns null for undefined or null input', () => {
    assert.strictEqual(safeUrl(undefined), null);
    assert.strictEqual(safeUrl(null), null);
    assert.strictEqual(safeUrl(''), null);
  });

  await t.test('returns null for invalid protocols (e.g. ftp)', () => {
    const url = 'ftp://example.com/file.zip';
    assert.strictEqual(safeUrl(url), null);
    assert.ok(lastError.includes('safeUrl: Invalid protocol rejected'));
  });

  await t.test('returns null for javascript pseudo-protocol', () => {
    const url = 'javascript:alert(1)';
    assert.strictEqual(safeUrl(url), null);
    assert.ok(lastError.includes('safeUrl: Invalid protocol rejected'));
  });

  await t.test('returns relative path starting with /', () => {
    const url = '/data/test.geojson';
    assert.strictEqual(safeUrl(url), url);
  });

  await t.test('returns null for invalid urls and unknown relative paths', () => {
    const url = 'invalid-url';
    assert.strictEqual(safeUrl(url), null);
    assert.ok(lastError.includes('safeUrl: Failed to parse URL'));
  });
});
