import Papa from "papaparse";
import { parseDate } from "./dateParser";
import { parseFrenchAmount } from "./amountParser";
import type { ColumnMapping, AmountMode, SignConvention } from "../shared/types";

export interface AutoDetectResult {
  delimiter: string;
  hasHeader: boolean;
  skipLines: number;
  dateFormat: string;
  columnMapping: ColumnMapping;
  amountMode: AmountMode;
  signConvention: SignConvention;
}

const DATE_FORMATS = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "YYYY/MM/DD",
  "DD-MM-YYYY",
  "DD.MM.YYYY",
  "YYYYMMDD",
];

const DELIMITERS = [",", ";", "\t"];

/**
 * Detect and unwrap Desjardins-style CSVs where each entire line is
 * wrapped in quotes with "" escaping inside.
 */
export function preprocessQuotedCSV(content: string): string {
  const lines = content.split(/\r?\n/);
  const nonEmpty = lines.filter((l) => l.trim());
  if (nonEmpty.length === 0) return content;

  const isLineQuoted = nonEmpty.every((l) => {
    const t = l.trim();
    return t.startsWith('"') && t.endsWith('"') && t.includes(',""');
  });

  if (!isLineQuoted) return content;

  return lines
    .map((l) => {
      const t = l.trim();
      if (!t) return "";
      return t.slice(1, -1).replace(/""/g, '"');
    })
    .join("\n");
}

/**
 * Analyze raw CSV content and return a suggested configuration,
 * or null if detection fails.
 */
export function autoDetectConfig(rawContent: string): AutoDetectResult | null {
  const content = preprocessQuotedCSV(rawContent);
  const lines = content.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return null;

  // Step 1: Detect delimiter
  const delimiter = detectDelimiter(lines.slice(0, 10));
  if (!delimiter) return null;

  const parsed = Papa.parse(content, { delimiter, skipEmptyLines: true });
  const data = parsed.data as string[][];
  if (data.length < 2) return null;

  // Step 1b: Detect preamble lines to skip
  // Find the expected column count (most frequent count > 1)
  const colCountFreq = new Map<number, number>();
  for (const row of data) {
    const len = row.length;
    if (len <= 1) continue;
    colCountFreq.set(len, (colCountFreq.get(len) || 0) + 1);
  }
  let expectedColCount = 0;
  let maxColFreq = 0;
  for (const [count, freq] of colCountFreq) {
    if (freq > maxColFreq) {
      maxColFreq = freq;
      expectedColCount = count;
    }
  }

  // Skip leading rows that don't match the expected column count
  let skipLines = 0;
  for (let i = 0; i < data.length; i++) {
    if (data[i].length >= expectedColCount) break;
    skipLines++;
  }

  const effectiveData = data.slice(skipLines);
  if (effectiveData.length < 2) return null;

  // Step 2: Detect header
  const hasHeader = detectHeader(effectiveData[0]);

  const dataStartIdx = hasHeader ? 1 : 0;
  const sampleRows = effectiveData.slice(dataStartIdx, dataStartIdx + 20);
  if (sampleRows.length === 0) return null;

  const colCount = Math.max(...effectiveData.slice(0, 10).map((r) => r.length));

  // Step 3: Detect date column + format
  const dateResult = detectDateColumn(sampleRows, colCount);
  if (!dateResult) return null;

  // Step 3b: Find ALL date-like columns (to exclude from amount candidates)
  const dateLikeCols = new Set<number>();
  for (let col = 0; col < colCount; col++) {
    for (const fmt of DATE_FORMATS) {
      let success = 0;
      let total = 0;
      for (const row of sampleRows) {
        const cell = row[col]?.trim();
        if (!cell) continue;
        total++;
        if (parseDate(cell, fmt)) success++;
      }
      if (total > 0 && success / total >= 0.8) {
        dateLikeCols.add(col);
        break;
      }
    }
  }

  // Step 4: Detect numeric columns
  const numericCols = detectNumericColumns(sampleRows, colCount);

  // Step 5: Detect balance columns and exclude them + date-like columns
  const balanceCols = detectBalanceColumns(sampleRows, numericCols);
  const amountCandidates = numericCols.filter(
    (c) => !balanceCols.has(c) && !dateLikeCols.has(c)
  );

  // Step 6: Detect description column
  const descriptionCol = detectDescriptionColumn(
    sampleRows,
    colCount,
    dateResult.column,
    new Set([...numericCols, ...dateLikeCols])
  );

  // Step 7: Determine amount mode
  const amountResult = detectAmountMode(sampleRows, amountCandidates);
  if (!amountResult) return null;

  const mapping: ColumnMapping = {
    date: dateResult.column,
    description: descriptionCol,
  };

  let signConvention: SignConvention = "negative_expense";

  if (amountResult.mode === "debit_credit") {
    mapping.debitAmount = amountResult.debitCol;
    mapping.creditAmount = amountResult.creditCol;
  } else {
    mapping.amount = amountResult.amountCol;
    signConvention = amountResult.signConvention;
  }

  return {
    delimiter,
    hasHeader,
    skipLines,
    dateFormat: dateResult.format,
    columnMapping: mapping,
    amountMode: amountResult.mode,
    signConvention,
  };
}

function detectDelimiter(lines: string[]): string | null {
  let bestDelimiter: string | null = null;
  let bestScore = 0;

  for (const delim of DELIMITERS) {
    const counts = lines.map(
      (line) =>
        Papa.parse(line, { delimiter: delim }).data[0] as string[]
    ).map((row) => row.length);

    // Find the most frequent column count > 1 (tolerates preamble lines)
    const countFreq = new Map<number, number>();
    for (const c of counts) {
      if (c <= 1) continue;
      countFreq.set(c, (countFreq.get(c) || 0) + 1);
    }
    if (countFreq.size === 0) continue;

    let modeCount = 0;
    let modeFreq = 0;
    for (const [count, freq] of countFreq) {
      if (freq > modeFreq || (freq === modeFreq && count > modeCount)) {
        modeFreq = freq;
        modeCount = count;
      }
    }

    const score = (modeFreq / counts.length) * modeCount;

    if (score > bestScore) {
      bestScore = score;
      bestDelimiter = delim;
    }
  }

  return bestDelimiter;
}

function detectHeader(firstRow: string[]): boolean {
  // A header row typically has no parseable dates and no parseable numbers
  let hasDate = false;
  let hasNumber = false;

  for (const cell of firstRow) {
    const trimmed = cell?.trim();
    if (!trimmed) continue;

    // Check for number
    if (!isNaN(parseFrenchAmount(trimmed))) {
      hasNumber = true;
    }

    // Check for date
    for (const fmt of DATE_FORMATS) {
      if (parseDate(trimmed, fmt)) {
        hasDate = true;
        break;
      }
    }
  }

  return !hasDate && !hasNumber;
}

function detectDateColumn(
  rows: string[][],
  colCount: number
): { column: number; format: string } | null {
  let bestCol = -1;
  let bestFormat = "";
  let bestRate = 0;

  for (let col = 0; col < colCount; col++) {
    for (const fmt of DATE_FORMATS) {
      let success = 0;
      let total = 0;

      for (const row of rows) {
        const cell = row[col]?.trim();
        if (!cell) continue;
        total++;
        if (parseDate(cell, fmt)) {
          success++;
        }
      }

      if (total === 0) continue;
      const rate = success / total;
      if (rate > bestRate) {
        bestRate = rate;
        bestCol = col;
        bestFormat = fmt;
      }
    }
  }

  if (bestRate < 0.8 || bestCol < 0) return null;

  return { column: bestCol, format: bestFormat };
}

function detectNumericColumns(rows: string[][], colCount: number): number[] {
  const result: number[] = [];

  for (let col = 0; col < colCount; col++) {
    let numericCount = 0;
    let nonEmpty = 0;
    const distinctValues = new Set<number>();

    for (const row of rows) {
      const cell = row[col]?.trim();
      if (!cell) continue;
      nonEmpty++;
      const val = parseFrenchAmount(cell);
      if (!isNaN(val)) {
        numericCount++;
        distinctValues.add(val);
      }
    }

    if (nonEmpty > 0 && numericCount / nonEmpty >= 0.5) {
      // Exclude constant-value columns (e.g., account numbers, transit numbers)
      if (distinctValues.size <= 1 && nonEmpty > 2) continue;
      result.push(col);
    }
  }

  return result;
}

function detectBalanceColumns(
  rows: string[][],
  numericCols: number[]
): Set<number> {
  const balanceCols = new Set<number>();
  if (numericCols.length < 2 || rows.length < 3) return balanceCols;

  const TOLERANCE = 0.015; // tolerance for floating-point comparison

  // Parse all numeric values once
  const values: Map<number, (number | null)[]> = new Map();
  for (const col of numericCols) {
    values.set(
      col,
      rows.map((row) => {
        const cell = row[col]?.trim();
        if (!cell) return null;
        const v = parseFrenchAmount(cell);
        return isNaN(v) ? null : v;
      })
    );
  }

  for (const balCol of numericCols) {
    const balVals = values.get(balCol)!;

    // Test single-column balance: balance[i] ≈ balance[i-1] ± amount[i]
    for (const amtCol of numericCols) {
      if (amtCol === balCol) continue;
      const amtVals = values.get(amtCol)!;

      let matches = 0;
      let tested = 0;

      for (let i = 1; i < rows.length; i++) {
        if (balVals[i] === null || balVals[i - 1] === null || amtVals[i] === null)
          continue;
        tested++;

        const diff = balVals[i]! - balVals[i - 1]!;
        // balance[i] = balance[i-1] + amount[i] OR balance[i] = balance[i-1] - amount[i]
        if (
          Math.abs(diff - amtVals[i]!) < TOLERANCE ||
          Math.abs(diff + amtVals[i]!) < TOLERANCE
        ) {
          matches++;
        }
      }

      if (tested >= 2 && matches / tested >= 0.8) {
        balanceCols.add(balCol);
        break;
      }
    }

    if (balanceCols.has(balCol)) continue;

    // Test two-column balance: balance[i] ≈ balance[i-1] - debit[i] + credit[i]
    for (let a = 0; a < numericCols.length; a++) {
      for (let b = a + 1; b < numericCols.length; b++) {
        const colA = numericCols[a];
        const colB = numericCols[b];
        if (colA === balCol || colB === balCol) continue;

        const valsA = values.get(colA)!;
        const valsB = values.get(colB)!;

        let matches = 0;
        let tested = 0;

        for (let i = 1; i < rows.length; i++) {
          if (balVals[i] === null || balVals[i - 1] === null) continue;
          const da = valsA[i] ?? 0;
          const db = valsB[i] ?? 0;
          tested++;

          const diff = balVals[i]! - balVals[i - 1]!;
          // Try both orderings: diff ≈ -colA + colB or diff ≈ colA - colB
          if (
            Math.abs(diff - (-da + db)) < TOLERANCE ||
            Math.abs(diff - (da - db)) < TOLERANCE
          ) {
            matches++;
          }
        }

        if (tested >= 2 && matches / tested >= 0.8) {
          balanceCols.add(balCol);
          break;
        }
      }
      if (balanceCols.has(balCol)) break;
    }
  }

  return balanceCols;
}

function detectDescriptionColumn(
  rows: string[][],
  colCount: number,
  dateCol: number,
  numericCols: Set<number>
): number {
  let bestCol = 0;
  let bestAvgLen = 0;

  for (let col = 0; col < colCount; col++) {
    if (col === dateCol || numericCols.has(col)) continue;

    let totalLen = 0;
    let count = 0;

    for (const row of rows) {
      const cell = row[col]?.trim();
      if (!cell) continue;
      totalLen += cell.length;
      count++;
    }

    const avgLen = count > 0 ? totalLen / count : 0;
    if (avgLen > bestAvgLen) {
      bestAvgLen = avgLen;
      bestCol = col;
    }
  }

  return bestCol;
}

interface SingleAmountResult {
  mode: "single";
  amountCol: number;
  signConvention: SignConvention;
}

interface DebitCreditResult {
  mode: "debit_credit";
  debitCol: number;
  creditCol: number;
}

type AmountModeResult = SingleAmountResult | DebitCreditResult;

function detectAmountMode(
  rows: string[][],
  amountCandidates: number[]
): AmountModeResult | null {
  if (amountCandidates.length === 0) return null;

  if (amountCandidates.length === 1) {
    return detectSingleAmount(rows, amountCandidates[0]);
  }

  // Check for sparse-complementary pair (debit/credit pattern)
  for (let a = 0; a < amountCandidates.length; a++) {
    for (let b = a + 1; b < amountCandidates.length; b++) {
      const colA = amountCandidates[a];
      const colB = amountCandidates[b];

      if (isSparseComplementary(rows, colA, colB)) {
        return { mode: "debit_credit", debitCol: colA, creditCol: colB };
      }
    }
  }

  // No complementary pair found — pick best single amount column
  const bestCol = pickBestAmountColumn(rows, amountCandidates);
  return detectSingleAmount(rows, bestCol);
}

/** Pick the best amount column: prefer columns with decimal values (cents). */
function pickBestAmountColumn(rows: string[][], candidates: number[]): number {
  let bestCol = candidates[0];
  let bestScore = -1;

  for (const col of candidates) {
    let decimalCount = 0;
    let nonEmpty = 0;

    for (const row of rows) {
      const cell = row[col]?.trim();
      if (!cell) continue;
      const val = parseFrenchAmount(cell);
      if (isNaN(val)) continue;
      nonEmpty++;
      if (!Number.isInteger(val)) {
        decimalCount++;
      }
    }

    const score = nonEmpty > 0 ? decimalCount / nonEmpty : 0;
    if (score > bestScore) {
      bestScore = score;
      bestCol = col;
    }
  }

  return bestCol;
}

function detectSingleAmount(
  rows: string[][],
  col: number
): SingleAmountResult {
  let negCount = 0;
  let total = 0;

  for (const row of rows) {
    const cell = row[col]?.trim();
    if (!cell) continue;
    const val = parseFrenchAmount(cell);
    if (isNaN(val)) continue;
    total++;
    if (val < 0) negCount++;
  }

  // If most values are negative, they likely represent expenses as negative
  const signConvention: SignConvention =
    total > 0 && negCount / total > 0.5
      ? "negative_expense"
      : "positive_expense";

  return { mode: "single", amountCol: col, signConvention };
}

function isSparseComplementary(
  rows: string[][],
  colA: number,
  colB: number
): boolean {
  let complementary = 0;
  let total = 0;

  for (const row of rows) {
    const cellA = row[colA]?.trim();
    const cellB = row[colB]?.trim();
    const valA = cellA ? parseFrenchAmount(cellA) : NaN;
    const valB = cellB ? parseFrenchAmount(cellB) : NaN;
    const hasA = !isNaN(valA) && valA !== 0;
    const hasB = !isNaN(valB) && valB !== 0;

    if (!hasA && !hasB) continue;
    total++;

    // Complementary: exactly one has a value
    if (hasA !== hasB) {
      complementary++;
    }
  }

  return total > 0 && complementary / total >= 0.7;
}
