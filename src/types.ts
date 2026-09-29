export type ThemeMode = 'matcha' | 'midnight' | 'retro' | 'blueprint' | 'coffee';

export type ToolMode = 'fill' | 'flag';

export type GameMode = 'free' | 'daily' | 'pack' | 'arcade' | 'zen';

export interface PuzzleDef {
  id: string;
  name: string;
  size: number;
  solution: number[][]; // 1 = filled, 0 = empty
  colorMap?: string[][]; // Optional hex colors for revealed art!
  packId?: string;
  dateKey?: string; // For daily puzzles
  author?: string;
}

export interface ClueSet {
  rows: number[][];
  cols: number[][];
}

export interface SolveRecord {
  t: number; // seconds
  clean: boolean; // solved without using Check
  mistakes: number;
  timestamp: number;
  puzzleId?: string;
  puzzleName?: string;
  size: number;
  mode: GameMode;
}

export interface PlayerStats {
  solved: number;
  clean: number;
  best: Record<number, { t: number; clean: boolean }>;
  last: Record<number, { t: number; clean: boolean }>;
  dailyHistory: Record<string, { t: number; clean: boolean; mistakes: number }>;
  packProgress: Record<string, string[]>; // packId -> array of completed puzzleIds
  solveLog: SolveRecord[];
}

export interface PuzzlePack {
  id: string;
  title: string;
  subtitle: string;
  size: number;
  icon: string;
  puzzles: PuzzleDef[];
}

export interface HintResult {
  row: number;
  col: number;
  target: 1 | 2; // 1 = fill, 2 = flag (X)
  reason: string;
}
