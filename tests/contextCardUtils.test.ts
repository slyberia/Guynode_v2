import test from 'node:test';
import assert from 'node:assert';
import { deriveValidationStatus } from '../utils/contextCardUtils.js';
import { ValidationStatus } from '../types.js';
import { Dataset } from '../types.js';

// Build a Dataset-ish object for the validator. deriveValidationStatus runs the
// real metadata validator, so we set the fields it inspects. `format: 'CSV'`
// avoids the GeoJSON map-preview claim (which would demand a preview URL), and
// no downloadUrl avoids the download claim — keeping these fixtures free of
// unrelated errors so we test the status-derivation logic specifically.
const REAL_SHA = 'sha256:9f86d081884c7d659a2feaa0c55ad015a3bf4f1b2b0b822cd15d6c15b0f00a08';

const make = (overrides: Partial<Dataset>): Dataset =>
  ({
    id: 'x',
    title: 'X',
    description: 'desc',
    format: 'CSV',
    source: 'Some Source',
    license: 'CC-BY-4.0',
    attribution: 'Some Source',
    caveats: ['Indicative only'],
    lastVerified: '2026-06-22',
    imageUrl: '/images/real.jpg',
    distributions: [{ label: 'csv', format: 'CSV', url: 'https://x/y.csv', checksum: REAL_SHA }],
    ...overrides,
  }) as Dataset;

test('deriveValidationStatus', async (t) => {
  await t.test('VERIFIED only when there are no errors and no warnings', () => {
    const result = deriveValidationStatus(make({}));
    assert.strictEqual(result.status, ValidationStatus.VERIFIED);
    assert.strictEqual(result.warningCount, 0);
    assert.strictEqual(result.errorCount, 0);
  });

  await t.test('WARNING when warnings exist but no errors (e.g. missing license)', () => {
    const result = deriveValidationStatus(make({ license: undefined }));
    assert.strictEqual(result.status, ValidationStatus.WARNING);
    assert.ok(result.warningCount > 0);
    assert.strictEqual(result.errorCount, 0);
  });

  await t.test('ERROR takes precedence when a required field is missing', () => {
    const result = deriveValidationStatus(make({ title: undefined as unknown as string }));
    assert.strictEqual(result.status, ValidationStatus.ERROR);
    assert.ok(result.errorCount > 0);
  });
});
