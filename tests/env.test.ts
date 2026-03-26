import test from 'node:test';
import assert from 'node:assert';
import { isBrowser, isProduction } from '../utils/env.js';

test('isBrowser', async (t) => {
  await t.test('returns false when window is undefined', () => {
    // Save original global window if any
    const originalWindow = (global as unknown as { window: Window }).window;
    delete (global as unknown as { window: Window }).window;

    assert.strictEqual(isBrowser(), false);

    // Restore
    if (originalWindow !== undefined) {
      (global as unknown as { window: Window }).window = originalWindow;
    }
  });

  await t.test('returns true when window is defined', () => {
    const originalWindow = (global as unknown as { window: Window }).window;
    (global as unknown as { window: Window }).window = {}; // mock window

    assert.strictEqual(isBrowser(), true);

    if (originalWindow === undefined) {
      delete (global as unknown as { window: Window }).window;
    } else {
      (global as unknown as { window: Window }).window = originalWindow;
    }
  });
});

test('isProduction', async (t) => {
  await t.test('returns true when process.env.NODE_ENV is production', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';

    // ensure window doesn't affect this test if it checks NODE_ENV first
    const originalWindow = (global as unknown as { window: Window }).window;
    delete (global as unknown as { window: Window }).window;

    assert.strictEqual(isProduction(), true);

    process.env.NODE_ENV = originalEnv;
    if (originalWindow !== undefined) {
      (global as unknown as { window: Window }).window = originalWindow;
    }
  });

  await t.test('returns true when hostname is not localhost', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const originalWindow = (global as unknown as { window: Window }).window;
    (global as unknown as { window: Window }).window = { location: { hostname: 'example.com' } };

    assert.strictEqual(isProduction(), true);

    process.env.NODE_ENV = originalEnv;
    if (originalWindow === undefined) {
      delete (global as unknown as { window: Window }).window;
    } else {
      (global as unknown as { window: Window }).window = originalWindow;
    }
  });

  await t.test('returns false when not production and hostname is localhost', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const originalWindow = (global as unknown as { window: Window }).window;
    (global as unknown as { window: Window }).window = { location: { hostname: 'localhost' } };

    assert.strictEqual(isProduction(), false);

    process.env.NODE_ENV = originalEnv;
    if (originalWindow === undefined) {
      delete (global as unknown as { window: Window }).window;
    } else {
      (global as unknown as { window: Window }).window = originalWindow;
    }
  });

  await t.test('returns false when not production and window is undefined', () => {
    const originalEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'development';

    const originalWindow = (global as unknown as { window: Window }).window;
    delete (global as unknown as { window: Window }).window;

    assert.strictEqual(isProduction(), false);

    process.env.NODE_ENV = originalEnv;
    if (originalWindow !== undefined) {
      (global as unknown as { window: Window }).window = originalWindow;
    }
  });
});
