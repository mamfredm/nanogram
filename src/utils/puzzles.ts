import { PuzzleDef, PuzzlePack } from '../types';
import { cluesFor, logicSolve } from './solver';

export function picGrid(str: string): number[][] {
  return str.split('|').map((row) =>
    row.split('').map((ch) => (ch === '#' ? 1 : 0))
  );
}

// Generates an attractive color grid for revealed artwork based on the picture category/palette
export function generateColorMap(name: string, grid: number[][]): string[][] {
  const n = grid.length;
  const out: string[][] = [];
  const lower = name.toLowerCase();

  for (let r = 0; r < n; r++) {
    const row: string[] = [];
    for (let c = 0; c < n; c++) {
      if (grid[r][c] === 0) {
        row.push('transparent');
        continue;
      }

      // Default high-contrast ink
      let color = '#2b3428';

      if (lower.includes('heart')) {
        color = r < 2 ? '#ef4444' : '#dc2626';
      } else if (lower.includes('tree') || lower.includes('cactus')) {
        if (r >= n - 2 && c >= Math.floor(n / 2) - 1 && c <= Math.floor(n / 2) + 1) {
          color = '#854d0e'; // Trunk
        } else {
          color = r % 2 === 0 ? '#15803d' : '#16a34a';
        }
      } else if (lower.includes('star') || lower.includes('crown') || lower.includes('bell') || lower.includes('key')) {
        color = r % 2 === 0 ? '#eab308' : '#ca8a04';
      } else if (lower.includes('apple')) {
        if (r < 2 && c >= 4 && c <= 6) color = '#15803d'; // Stem/leaf
        else color = '#dc2626';
      } else if (lower.includes('boat') || lower.includes('sail') || lower.includes('whale') || lower.includes('fish')) {
        if (r < n * 0.6) color = '#f8fafc'; // White sail
        else color = '#0284c7'; // Hull / sea
      } else if (lower.includes('flower')) {
        if (r === Math.floor(n / 2) && c === Math.floor(n / 2)) color = '#facc15';
        else if (r >= n - 2) color = '#16a34a';
        else color = '#ec4899';
      } else if (lower.includes('coffee') || lower.includes('cup')) {
        if (r < 3) color = '#94a3b8'; // Steam
        else color = '#78350f'; // Coffee brown
      } else if (lower.includes('mushroom')) {
        if (r < n * 0.6) color = '#dc2626'; // Red cap
        else color = '#fef08a'; // Cream stem
      } else if (lower.includes('rocket') || lower.includes('shuttle')) {
        if (r < 3) color = '#dc2626'; // Nosecone
        else if (r >= n - 2) color = '#f97316'; // Flames
        else color = '#38bdf8'; // Body
      } else if (lower.includes('cat') || lower.includes('owl') || lower.includes('rabbit')) {
        color = '#f59e0b';
      } else if (lower.includes('ghost')) {
        color = '#cbd5e1';
      } else if (lower.includes('diamond')) {
        color = '#38bdf8';
      } else if (lower.includes('potion')) {
        color = r < 3 ? '#94a3b8' : '#8b5cf6';
      } else {
        // Aesthetic natural gradient
        color = '#059669';
      }

      row.push(color);
    }
    out.push(row);
  }
  return out;
}

// Built-in puzzle patterns
const PICS_5: Record<string, string> = {
  'Heart': '.#.#.|#####|#####|.###.|..#..',
  'House': '..#..|.###.|#####|.#.#.|.#.#.',
  'Arrow': '..#..|.###.|#.#.#|..#..|..#..',
  'Pine Tree': '..#..|.###.|#####|..#..|..#..',
  'Star': '..#..|#####|.###.|.#.#.|#...#',
  'Sailboat': '..#..|..##.|..#..|#####|.###.',
  'Kitten': '#...#|##.##|#####|#.#.#|.###.',
  'Goldfish': '.....|.##.#|#####|.##.#|.....',
  'Mushroom': '.###.|#####|#.#.#|..#..|.###.',
  'Temple Bell': '..#..|.###.|.###.|#####|..#..',
  'Skeleton Key': '.#...|#.###|#.#.#|.#...|.....',
  'Petal Flower': '.#.#.|#####|..#..|.###.|..#..',
};

const PICS_10: Record<string, string> = {
  'Rocket Ship': '....##....|...####...|...#..#...|...#..#...|...####...|..######..|..######..|.##.##.##.|.#..##..#.|...#..#...',
  'Curious Cat': '#........#|##......##|##########|##########|#..####..#|##########|####..####|.########.|..######..|...####...',
  'Umbrella': '....##....|..######..|.########.|##########|#.#.##.#.#|....##....|....##....|....##....|.#..##....|..###.....',
  'Sailboat': '....#.....|....##....|....###...|....####..|....#####.|....#.....|##########|.########.|..######..|..........',
  'Crisp Apple': '.....#....|....##....|..##.##...|.########.|##########|##########|##########|.########.|.########.|..##..##..',
  'Music Note': '...#######|...#######|...#.....#|...#.....#|...#.....#|...#..####|.###.#####|####.#####|####..###.|.##.......',
  'Forest Shroom': '..#####...|.########.|##..####.#|##..###..#|##########|...####...|...####...|...####...|..######..|..........',
  'Hot Coffee': '.#..#.....|#..#......|.#..#.....|..........|#######...|########..|#######.#.|########..|.#####....|#########.',
  'Navy Anchor': '....##....|...#..#...|....##....|..######..|....##....|#...##...#|#...##...#|##..##..##|.########.|...####...',
  'Oak Tree': '....##....|...####...|..######..|...####...|..######..|.########.|##########|....##....|....##....|...####...',
  'Spooky Ghost': '...####...|..######..|.########.|.#..##..#.|.#..##..#.|.########.|##########|##########|##########|#.##..##.#',
  'Royal Crown': '..........|#...##...#|##..##..##|###.##.###|##########|##########|#.##.##.##|##########|##########|..........',
  'Golden Bell': '....##....|...####...|..######..|..######..|..######..|.########.|.########.|##########|##########|....##....',
  'Crescent Moon': '....####..|..####....|.###......|.##.......|###.......|###.......|.##.......|.###......|..####....|....####..',
  'Desert Cactus': '....##....|....##....|.#..##....|.#..##..#.|.#..##..#.|.#####..#.|....#####.|....##....|....##....|..######..',
  'Sports Car': '..........|...####...|..#.##.#..|.########.|##########|##########|.##....##.|.##....##.|..........|..........',
  'Light Bulb': '...####...|..######..|.########.|.########.|.########.|..######..|...####...|...####...|...####...|....##....',
  'Cottage': '....##....|...####...|..######..|.########.|##########|.########.|.#..#####.|.#..##..#.|.#####..#.|.#####..#.',
};

const PICS_15: Record<string, string> = {
  'Blue Whale': '...............|..........#.#..|...........#...|..#######......|.#########....#|###########..##|##.#########.##|###############|###############|.#############.|..###########..|....#######....|...............|...............|...............',
  'Wise Owl': '..#.........#..|..##.......##..|..###########..|.#############.|.##...###...##.|.#..#..#..#..#.|.##...###...##.|.######.######.|.######.######.|..###########..|..###########..|...#########...|....#######....|...##.....##...|...............',
  'Monarch Butterfly': '.....#.#.#.....|......#.#......|.###...#...###.|#####..#..#####|######.#.######|###############|.######.######.|..#####.#####..|...####.####...|..#####.#####..|.######.######.|.#####.#.#####.|..###..#..###..|.......#.......|...............',
  'Sleeping Cat': '..#.....#......|..##...##......|..#######......|.#########.....|.##.###.##.....|.#########.....|..#######....#.|...#####.....#.|..#######...#..|.#########.##..|.###########...|.###########...|.##########....|.##.####.##....|...............',
  'Wild Rabbit': '....#..#.......|...##..##......|...##..##......|...##..##......|...#######.....|..#########....|..##.###.##....|..#########....|...#######.....|..#########....|.###########...|.############.#|.#############.|.##..####..##..|...............',
  'Royal Castle': '#.#.#.....#.#.#|#####.....#####|#####.#.#.#####|###############|##.##.###.##.##|##.##.###.##.##|###############|###############|#####.....#####|####.......####|####...#...####|###############|...............|...............|...............',
  'Apollo Rocket': '.......#.......|......###......|.....#####.....|.....#...#.....|.....#...#.....|.....#####.....|.....#####.....|....#######....|...##.###.##...|..##..###..##..|..#...###...#..|.....#...#.....|....##...##....|.....#...#.....|...............',
  'Steam Locomotive': '...........##..|...........##..|......#######..|...############|..############.|.#############.|.#############.|.#############.|.#############.|###############|..####...####..|..####...####..|.######.######.|.######.######.|...............',
};

const PICS_RETRO: Record<string, string> = {
  'Game Controller': '..........|..######..|##########|#..#..#..#|##########|####..####|.##....##.|.##....##.|..........|..........',
  'Space Invader': '..#......#..|...#....#...|..########..|..###.####..|############|#.########.#|#.#......#.#|...##..##...|............|............',
  'Diamond Gem': '...######...|..########..|.##########.|##############|##############|..##########..|...########...|....######....|.....####.....|......##......',
  'Magic Potion': '....####....|....####....|.....##.....|...######...|..########..|.##########.|.##########.|.##########.|..########..|...######...',
};

function createPuzzleDef(id: string, name: string, size: number, str: string, packId: string): PuzzleDef {
  const grid = picGrid(str);
  return {
    id,
    name,
    size,
    solution: grid,
    colorMap: generateColorMap(name, grid),
    packId,
  };
}

export const PUZZLE_PACKS: PuzzlePack[] = [
  {
    id: 'starter',
    title: 'Starter Garden',
    subtitle: '12 bite-sized 5×5 intro puzzles',
    size: 5,
    icon: 'Sparkles',
    puzzles: Object.entries(PICS_5).map(([name, str], idx) =>
      createPuzzleDef(`starter_${idx}`, name, 5, str, 'starter')
    ),
  },
  {
    id: 'fauna',
    title: 'Fauna & Flora',
    subtitle: '18 satisfying 10×10 pictures',
    size: 10,
    icon: 'Trees',
    puzzles: Object.entries(PICS_10).map(([name, str], idx) =>
      createPuzzleDef(`fauna_${idx}`, name, 10, str, 'fauna')
    ),
  },
  {
    id: 'master',
    title: 'Grand Expeditions',
    subtitle: '8 intricate 15×15 tapestries',
    size: 15,
    icon: 'Compass',
    puzzles: Object.entries(PICS_15).map(([name, str], idx) =>
      createPuzzleDef(`master_${idx}`, name, 15, str, 'master')
    ),
  },
  {
    id: 'retro',
    title: 'Arcade Relics',
    subtitle: 'Retro icons & 8-bit treasures',
    size: 10,
    icon: 'Gamepad2',
    puzzles: Object.entries(PICS_RETRO).map(([name, str], idx) => {
      const size = str.split('|').length;
      return createPuzzleDef(`retro_${idx}`, name, size, str, 'retro');
    }),
  },
];

// Seeded PRNG for daily deterministic generator
export function mulberry32(seed: number): () => number {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function hashStr(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function generateBlob(n: number, rng: () => number): number[][] {
  const grid: number[][] = [];
  for (let r = 0; r < n; r++) grid.push(new Array(n).fill(0));
  const target = Math.round(n * n * (0.42 + rng() * 0.14));
  const frontier = new Map<string, [number, number]>();

  function addFrontier(r: number, c: number) {
    [
      [1, 0],
      [-1, 0],
      [0, 1],
      [0, -1],
    ].forEach(([dr, dc]) => {
      const nr = r + dr;
      const nc = c + dc;
      if (nr >= 0 && nr < n && nc >= 0 && nc < n && !grid[nr][nc]) {
        frontier.set(`${nr},${nc}`, [nr, nc]);
      }
    });
  }

  const sr = Math.floor(n / 2);
  const sc = Math.floor(n / 2);
  grid[sr][sc] = 1;
  let filled = 1;
  addFrontier(sr, sc);

  while (filled < target && frontier.size > 0) {
    const keys = Array.from(frontier.keys());
    const pick = keys[Math.floor(rng() * keys.length)];
    const rc = frontier.get(pick)!;
    frontier.delete(pick);
    if (grid[rc[0]][rc[1]]) continue;
    grid[rc[0]][rc[1]] = 1;
    filled++;
    addFrontier(rc[0], rc[1]);
  }
  return grid;
}

function repair(sol: number[][], n: number, rng: () => number, mirror: boolean): boolean {
  for (let iter = 0; iter < n * n * 2; iter++) {
    const cl = cluesFor(sol);
    const g = logicSolve(cl.rows, cl.cols, n);
    if (!g) return false;
    const unknown: [number, number][] = [];
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (g[r][c] === -1) unknown.push([r, c]);
      }
    }
    if (unknown.length === 0) return true;
    const p = unknown[Math.floor(rng() * unknown.length)];
    const v = sol[p[0]][p[1]] ? 0 : 1;
    sol[p[0]][p[1]] = v;
    if (mirror) sol[p[0]][n - 1 - p[1]] = v;
  }
  return false;
}

export function generateDailyPuzzle(dateKey: string): PuzzleDef {
  const p = dateKey.split('-');
  const dow = new Date(+p[0], +p[1] - 1, +p[2], 12).getDay();
  // Weekend puzzles are 15x15, weekdays are 10x10
  const n = dow === 0 || dow === 6 ? 15 : 10;

  const rng = mulberry32(hashStr(dateKey));
  let sol: number[][] = [];

  // Try mirrored first for artistic symmetry
  for (let attempt = 0; attempt < 30; attempt++) {
    sol = generateBlob(n, rng);
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n / 2; c++) {
        sol[r][n - 1 - c] = sol[r][c];
      }
    }
    if (repair(sol, n, rng, true)) break;
  }

  // Fallback to asymmetric if symmetry failed
  if (sol.length === 0 || !repair(sol, n, rng, false)) {
    for (let attempt = 0; attempt < 30; attempt++) {
      sol = generateBlob(n, rng);
      if (repair(sol, n, rng, false)) break;
    }
  }

  return {
    id: `daily_${dateKey}`,
    name: `Daily ${dateKey}`,
    size: n,
    solution: sol,
    colorMap: generateColorMap('daily', sol),
    dateKey,
  };
}

export function getRandomPuzzleBySize(size: number, excludeId?: string): PuzzleDef {
  const pack = PUZZLE_PACKS.find((p) => p.size === size) || PUZZLE_PACKS[0];
  const candidates = pack.puzzles.filter((p) => p.id !== excludeId);
  const chosen = candidates.length > 0 ? candidates[Math.floor(Math.random() * candidates.length)] : pack.puzzles[0];
  return chosen;
}
