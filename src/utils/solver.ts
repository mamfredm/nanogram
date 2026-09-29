import { ClueSet, HintResult } from '../types';

export function blocksOf(clue: number[]): number[] {
  return clue.length === 1 && clue[0] === 0 ? [] : clue;
}

export function lineClues(arr: number[]): number[] {
  const clues: number[] = [];
  let run = 0;
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] === 1) {
      run++;
    } else if (run > 0) {
      clues.push(run);
      run = 0;
    }
  }
  if (run > 0) clues.push(run);
  return clues.length ? clues : [0];
}

export function cluesFor(sol: number[][]): ClueSet {
  const n = sol.length;
  const rows = sol.map(lineClues);
  const cols: number[][] = [];
  for (let c = 0; c < n; c++) {
    const col: number[] = [];
    for (let r = 0; r < n; r++) {
      col.push(sol[r][c]);
    }
    cols.push(lineClues(col));
  }
  return { rows, cols };
}

export function lineSatisfied(filledArr: number[], clue: number[]): boolean {
  const got = lineClues(filledArr);
  if (got.length !== clue.length) return false;
  for (let i = 0; i < got.length; i++) {
    if (got[i] !== clue[i]) return false;
  }
  return true;
}

/**
 * Solves a single nonogram line given current cell knowledge (-1 unknown, 0 empty/flagged, 1 filled).
 * Returns array of deduced cells (-1, 0, or 1) or null if contradiction.
 */
export function solveLine(cells: number[], clue: number[]): number[] | null {
  const n = cells.length;
  const b = blocksOf(clue);
  const k = b.length;

  const zeros: number[] = [0];
  for (let i = 0; i < n; i++) {
    zeros.push(zeros[i] + (cells[i] === 0 ? 1 : 0));
  }
  function fits(a: number, e: number): boolean {
    return e <= n && zeros[e] - zeros[a] === 0;
  }

  // S[i][j] = true if remaining cells from index i can fit remaining blocks from index j
  const S: boolean[][] = [];
  for (let i = 0; i <= n; i++) {
    S.push(new Array(k + 1).fill(false));
  }
  S[n][k] = true;

  for (let i = n - 1; i >= 0; i--) {
    for (let j = k; j >= 0; j--) {
      let ok = cells[i] !== 1 && S[i + 1][j];
      if (!ok && j < k) {
        const e = i + b[j];
        if (fits(i, e)) {
          ok = e === n ? S[n][j + 1] : cells[e] !== 1 && S[e + 1][j + 1];
        }
      }
      S[i][j] = ok;
    }
  }

  if (!S[0][0]) return null;

  const reach: boolean[][] = [];
  for (let i = 0; i <= n; i++) {
    reach.push(new Array(k + 1).fill(false));
  }
  reach[0][0] = true;

  const canF = new Array(n).fill(false);
  const canE = new Array(n).fill(false);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j <= k; j++) {
      if (!reach[i][j]) continue;
      if (cells[i] !== 1 && S[i + 1][j]) {
        canE[i] = true;
        reach[i + 1][j] = true;
      }
      if (j < k) {
        const end = i + b[j];
        if (!fits(i, end)) continue;
        if (end === n) {
          if (S[n][j + 1]) {
            for (let x = i; x < end; x++) canF[x] = true;
            reach[n][j + 1] = true;
          }
        } else if (cells[end] !== 1 && S[end + 1][j + 1]) {
          for (let x = i; x < end; x++) canF[x] = true;
          canE[end] = true;
          reach[end + 1][j + 1] = true;
        }
      }
    }
  }

  const out: number[] = [];
  for (let i = 0; i < n; i++) {
    out.push(canF[i] && !canE[i] ? 1 : canE[i] && !canF[i] ? 0 : -1);
  }
  return out;
}

/**
 * Runs full 2D logic constraint propagation.
 * Returns grid of -1, 0, 1 or null on contradiction.
 */
export function logicSolve(rClues: number[][], cClues: number[][], n: number): number[][] | null {
  const g: number[][] = [];
  for (let r = 0; r < n; r++) g.push(new Array(n).fill(-1));

  let changed = true;
  let iterations = 0;
  while (changed && iterations < n * 8) {
    changed = false;
    iterations++;

    // Row pass
    for (let r = 0; r < n; r++) {
      const row = solveLine(g[r], rClues[r]);
      if (!row) return null;
      for (let c = 0; c < n; c++) {
        if (row[c] !== g[r][c] && row[c] !== -1) {
          g[r][c] = row[c];
          changed = true;
        }
      }
    }

    // Col pass
    for (let c = 0; c < n; c++) {
      const col: number[] = [];
      for (let r = 0; r < n; r++) col.push(g[r][c]);
      const res = solveLine(col, cClues[c]);
      if (!res) return null;
      for (let r = 0; r < n; r++) {
        if (res[r] !== g[r][c] && res[r] !== -1) {
          g[r][c] = res[r];
          changed = true;
        }
      }
    }
  }

  return g;
}

export function isUniquelySolvable(sol: number[][]): boolean {
  const n = sol.length;
  const clues = cluesFor(sol);
  const solvedGrid = logicSolve(clues.rows, clues.cols, n);
  if (!solvedGrid) return false;

  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (solvedGrid[r][c] === -1) return false;
      if (solvedGrid[r][c] !== sol[r][c]) return false;
    }
  }
  return true;
}

/**
 * Analyzes the player's current board state to find a cell that can be logically deduced
 * from line clues right now, providing an educational explanation.
 */
export function findLogicalHint(
  playerState: number[][],
  solution: number[][],
  rClues: number[][],
  cClues: number[][]
): HintResult | null {
  const n = playerState.length;

  // Convert playerState to -1, 0, 1 (1 = filled, 2 = flag -> treat as 0, 0 = unknown -> -1)
  const known: number[][] = [];
  for (let r = 0; r < n; r++) {
    const row: number[] = [];
    for (let c = 0; c < n; c++) {
      const val = playerState[r][c];
      if (val === 1) row.push(1);
      else if (val === 2) row.push(0);
      else row.push(-1);
    }
    known.push(row);
  }

  // 1. Check rows for single-line deduction
  for (let r = 0; r < n; r++) {
    const deduction = solveLine(known[r], rClues[r]);
    if (!deduction) continue;
    for (let c = 0; c < n; c++) {
      if (known[r][c] === -1 && deduction[c] !== -1) {
        const isFill = deduction[c] === 1;
        const target = isFill ? 1 : 2;
        const clueStr = rClues[r].join(', ');
        return {
          row: r,
          col: c,
          target,
          reason: isFill
            ? `Row ${r + 1} with clue [${clueStr}] logically requires cell ${c + 1} to be filled.`
            : `Row ${r + 1} with clue [${clueStr}] guarantees cell ${c + 1} must be empty (X).`,
        };
      }
    }
  }

  // 2. Check cols for single-line deduction
  for (let c = 0; c < n; c++) {
    const col: number[] = [];
    for (let r = 0; r < n; r++) col.push(known[r][c]);
    const deduction = solveLine(col, cClues[c]);
    if (!deduction) continue;
    for (let r = 0; r < n; r++) {
      if (known[r][c] === -1 && deduction[r] !== -1) {
        const isFill = deduction[r] === 1;
        const target = isFill ? 1 : 2;
        const clueStr = cClues[c].join(', ');
        return {
          row: r,
          col: c,
          target,
          reason: isFill
            ? `Column ${c + 1} with clue [${clueStr}] logically requires row ${r + 1} to be filled.`
            : `Column ${c + 1} with clue [${clueStr}] guarantees row ${r + 1} must be empty (X).`,
        };
      }
    }
  }

  // 3. Fallback: Find any unrevealed cell from solution
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      const pVal = playerState[r][c];
      const sVal = solution[r][c];
      if ((pVal === 0) || (pVal === 1 && sVal !== 1) || (pVal === 2 && sVal === 1)) {
        return {
          row: r,
          col: c,
          target: sVal === 1 ? 1 : 2,
          reason: sVal === 1 ? `Cell at row ${r + 1}, column ${c + 1} is part of the picture.` : `Cell at row ${r + 1}, column ${c + 1} is an empty background space.`,
        };
      }
    }
  }

  return null;
}
