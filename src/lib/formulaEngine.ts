/**
 * Lightweight Spreadsheet Formula Evaluator for LBF Solutions
 * Supports cell references (A1, B2, etc.), ranges (A1:A10),
 * basic arithmetic (+, -, *, /), SUM, AVERAGE, MIN, MAX, COUNT, and IF.
 */

export function colLetterToIndex(col: string): number {
  let index = 0;
  for (let i = 0; i < col.length; i++) {
    index = index * 26 + (col.charCodeAt(i) - 64);
  }
  return index - 1;
}

export function indexToColLetter(index: number): string {
  let col = '';
  let temp = index;
  while (temp >= 0) {
    col = String.fromCharCode((temp % 26) + 65) + col;
    temp = Math.floor(temp / 26) - 1;
  }
  return col;
}

export function parseCellAddress(addr: string): { col: string; row: number } | null {
  const match = addr.trim().toUpperCase().match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  return {
    col: match[1],
    row: parseInt(match[2], 10)
  };
}

export function getCellsInRange(rangeStr: string): string[] {
  const parts = rangeStr.split(':').map((s) => s.trim().toUpperCase());
  if (parts.length === 1) return [parts[0]];
  if (parts.length !== 2) return [];

  const start = parseCellAddress(parts[0]);
  const end = parseCellAddress(parts[1]);
  if (!start || !end) return [];

  const startCol = colLetterToIndex(start.col);
  const endCol = colLetterToIndex(end.col);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);

  const minRow = Math.min(start.row, end.row);
  const maxRow = Math.max(start.row, end.row);

  const cells: string[] = [];
  for (let r = minRow; r <= maxRow; r++) {
    for (let c = minCol; c <= maxCol; c++) {
      cells.push(`${indexToColLetter(c)}${r}`);
    }
  }
  return cells;
}

export function evaluateFormula(
  formula: string,
  getCellValue: (cellAddr: string) => number | string
): number | string {
  if (!formula.startsWith('=')) return formula;

  const rawExpr = formula.substring(1).trim();

  // Helper to get numeric value of a cell
  const getNumVal = (addr: string): number => {
    const v = getCellValue(addr);
    if (typeof v === 'number') return v;
    const clean = String(v).replace(/[$,]/g, '').trim();
    const parsed = parseFloat(clean);
    return isNaN(parsed) ? 0 : parsed;
  };

  try {
    // 1. SUM function
    const sumMatch = rawExpr.match(/^SUM\(([^)]+)\)$/i);
    if (sumMatch) {
      const range = sumMatch[1];
      const cells = getCellsInRange(range);
      return cells.reduce((acc, cell) => acc + getNumVal(cell), 0);
    }

    // 2. AVERAGE function
    const avgMatch = rawExpr.match(/^AVERAGE\(([^)]+)\)$/i);
    if (avgMatch) {
      const range = avgMatch[1];
      const cells = getCellsInRange(range);
      if (cells.length === 0) return 0;
      const sum = cells.reduce((acc, cell) => acc + getNumVal(cell), 0);
      return sum / cells.length;
    }

    // 3. MIN function
    const minMatch = rawExpr.match(/^MIN\(([^)]+)\)$/i);
    if (minMatch) {
      const range = minMatch[1];
      const cells = getCellsInRange(range);
      if (cells.length === 0) return 0;
      return Math.min(...cells.map(getNumVal));
    }

    // 4. MAX function
    const maxMatch = rawExpr.match(/^MAX\(([^)]+)\)$/i);
    if (maxMatch) {
      const range = maxMatch[1];
      const cells = getCellsInRange(range);
      if (cells.length === 0) return 0;
      return Math.max(...cells.map(getNumVal));
    }

    // 5. COUNT function
    const countMatch = rawExpr.match(/^COUNT\(([^)]+)\)$/i);
    if (countMatch) {
      const range = countMatch[1];
      const cells = getCellsInRange(range);
      return cells.filter((c) => {
        const val = getCellValue(c);
        return val !== '' && val !== null && val !== undefined;
      }).length;
    }

    // 6. IF function: e.g. IF(C1>100, 10, 0)
    const ifMatch = rawExpr.match(/^IF\(([^,]+),([^,]+),([^)]+)\)$/i);
    if (ifMatch) {
      const conditionStr = ifMatch[1].trim();
      const trueValStr = ifMatch[2].trim();
      const falseValStr = ifMatch[3].trim();

      // Resolve cell values in condition
      const replacedCond = conditionStr.replace(/\b([A-Z]+\d+)\b/gi, (match) => {
        return String(getNumVal(match));
      });

      // Simple condition comparison
      let conditionResult = false;
      if (replacedCond.includes('>=')) {
        const [a, b] = replacedCond.split('>=').map(Number);
        conditionResult = a >= b;
      } else if (replacedCond.includes('<=')) {
        const [a, b] = replacedCond.split('<=').map(Number);
        conditionResult = a <= b;
      } else if (replacedCond.includes('>')) {
        const [a, b] = replacedCond.split('>').map(Number);
        conditionResult = a > b;
      } else if (replacedCond.includes('<')) {
        const [a, b] = replacedCond.split('<').map(Number);
        conditionResult = a < b;
      } else if (replacedCond.includes('=')) {
        const [a, b] = replacedCond.split('=').map(Number);
        conditionResult = a === b;
      }

      const resultToEval = conditionResult ? trueValStr : falseValStr;
      if (resultToEval.startsWith('=')) {
        return evaluateFormula(resultToEval, getCellValue);
      }
      return evaluateFormula('=' + resultToEval, getCellValue);
    }

    // 7. General arithmetic formula: e.g. =C5*D5 or =F12-F13 or =(A1+B1)*1.15
    // Replace all cell addresses with their numeric values
    const sanitized = rawExpr.replace(/\b([A-Z]+\d+)\b/gi, (match) => {
      const num = getNumVal(match);
      return String(num);
    });

    // Validate safe mathematical expression characters only: digits, dots, +, -, *, /, (, ), %
    if (!/^[\d\s\.\+\-\*\/\(\)\%]+$/.test(sanitized)) {
      return '#VALUE!';
    }

    // Handle percentage, e.g. 5% -> (5/100)
    const withPercents = sanitized.replace(/(\d+(?:\.\d+)?)%/g, '($1/100)');

    // Safe mathematical evaluation
    // eslint-disable-next-line no-new-func
    const result = Function(`'use strict'; return (${withPercents})`)();
    if (typeof result === 'number') {
      if (isNaN(result) || !isFinite(result)) return '#ERROR!';
      return Math.round(result * 100) / 100;
    }
    return result;
  } catch (err) {
    return '#ERROR!';
  }
}
