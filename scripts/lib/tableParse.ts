// Shared CSV/XLSX parsing for the offline table scripts (preview + points).
// Handles a leading title/blank row and fully headerless files (e.g. GeoNames
// exports), so both consumers detect columns identically.

import * as XLSX from 'xlsx';

export type Cell = string | number | null;

export interface ParsedTable {
  columns: string[];
  rows: Cell[][];
  totalRows: number;
  /** true when column names were synthesized (source had no header row). */
  synthesizedColumns: boolean;
}

const cellStr = (c: unknown) => (c === null || c === undefined ? '' : String(c).trim());

const normalizeCell = (v: unknown): Cell => {
  if (v === null || v === undefined || v === '') return null;
  if (typeof v === 'number' || typeof v === 'string') return v;
  return String(v);
};

export const parseTable = (buf: Buffer): ParsedTable => {
  const wb = XLSX.read(buf, { type: 'buffer', codepage: 1252 });
  const sheetName = wb.SheetNames[0];
  if (!sheetName) throw new Error('workbook has no sheets');
  const sheet = wb.Sheets[sheetName];
  const matrix = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, blankrows: false, defval: null });
  if (matrix.length === 0) throw new Error('sheet is empty');

  const nonBlank = (row: unknown[]) => row.filter((c) => cellStr(c) !== '').length;
  const looksNumeric = (c: unknown) => {
    const s = cellStr(c);
    return s !== '' && !Number.isNaN(Number(s));
  };

  // Candidate header = first row with >= 2 non-blank cells (skips title rows).
  let candidateIdx = matrix.findIndex((row) => nonBlank(row) >= 2);
  if (candidateIdx < 0) candidateIdx = 0;

  // A real header is all-text; numeric cells mean the file is headerless.
  const candidate = matrix[candidateIdx];
  const candidateCells = candidate.filter((c) => cellStr(c) !== '');
  const isHeader = candidateCells.length > 0 && candidateCells.every((c) => !looksNumeric(c));

  let columns: string[];
  let keepIdx: number[];
  let dataRows: unknown[][];
  let synthesizedColumns: boolean;

  if (isHeader) {
    const headerRow = candidate.map(cellStr);
    keepIdx = headerRow.map((h, i) => (h !== '' ? i : -1)).filter((i) => i >= 0);
    columns = keepIdx.map((i) => headerRow[i]);
    dataRows = matrix.slice(candidateIdx + 1);
    synthesizedColumns = false;
  } else {
    const width = matrix.slice(candidateIdx).reduce((w, r) => Math.max(w, r.length), 0);
    keepIdx = Array.from({ length: width }, (_, i) => i);
    columns = keepIdx.map((i) => `col${i + 1}`);
    dataRows = matrix.slice(candidateIdx);
    synthesizedColumns = true;
  }

  const rows: Cell[][] = dataRows.map((r) => keepIdx.map((i) => normalizeCell(r[i])));
  return { columns, rows, totalRows: dataRows.length, synthesizedColumns };
};
