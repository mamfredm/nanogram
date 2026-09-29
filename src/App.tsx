import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Sparkles,
  Calendar,
  Layers,
  ChevronRight,
  Flame,
  CheckCircle2,
  RefreshCw,
  Trophy,
} from 'lucide-react';
import {
  GameMode,
  PlayerStats,
  PuzzleDef,
  ThemeMode,
  ToolMode,
} from './types';
import { TopNav } from './components/TopNav';
import { Board } from './components/Board';
import { Controls } from './components/Controls';
import { WinModal } from './components/WinModal';
import { PackSelectorModal } from './components/PackSelectorModal';
import { StatsModal } from './components/StatsModal';
import { PuzzleStudioModal } from './components/PuzzleStudioModal';
import { SettingsModal } from './components/SettingsModal';
import {
  PUZZLE_PACKS,
  generateDailyPuzzle,
  getRandomPuzzleBySize,
} from './utils/puzzles';
import { cluesFor, lineSatisfied, findLogicalHint } from './utils/solver';
import { isSoundEnabled, setSoundEnabled, sfx } from './utils/audio';

const STATS_STORAGE_KEY = 'nonogrid_stats_v2';
const SAVED_GAME_KEY = 'nonogrid_saved_game_v2';
const THEME_STORAGE_KEY = 'nonogrid_theme_v2';
const AUTO_X_STORAGE_KEY = 'nonogrid_autox_v2';

function getTodayKey(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export default function App() {
  // Theme state
  const [theme, setTheme] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(THEME_STORAGE_KEY);
      if (saved && ['matcha', 'midnight', 'retro', 'blueprint', 'coffee'].includes(saved)) {
        return saved as ThemeMode;
      }
    } catch {
      // ignore
    }
    return 'matcha';
  });

  // Sound state
  const [soundOn, setSoundOn] = useState<boolean>(isSoundEnabled);

  // Auto-X state
  const [autoXEnabled, setAutoXEnabled] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem(AUTO_X_STORAGE_KEY);
      return saved !== 'false';
    } catch {
      return true;
    }
  });

  // Apply theme to root document
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  // Statistics state
  const [stats, setStats] = useState<PlayerStats>(() => {
    try {
      const saved = localStorage.getItem(STATS_STORAGE_KEY);
      if (saved) return JSON.parse(saved);
    } catch {
      // ignore
    }
    return {
      solved: 0,
      clean: 0,
      best: {},
      last: {},
      dailyHistory: {},
      packProgress: {},
      solveLog: [],
    };
  });

  const saveStats = (newStats: PlayerStats) => {
    setStats(newStats);
    try {
      localStorage.setItem(STATS_STORAGE_KEY, JSON.stringify(newStats));
    } catch {
      // ignore
    }
  };

  // Game state
  const [currentTab, setCurrentTab] = useState<'play' | 'packs' | 'daily' | 'studio'>('play');
  const [gameMode, setGameMode] = useState<GameMode>('free');
  const [puzzle, setPuzzle] = useState<PuzzleDef>(() => {
    return PUZZLE_PACKS[1].puzzles[0]; // 10x10 rocket
  });

  const [playerState, setPlayerState] = useState<number[][]>(() =>
    Array(10).fill(0).map(() => Array(10).fill(0))
  );

  const [toolMode, setToolMode] = useState<ToolMode>('fill');
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [isSolved, setIsSolved] = useState<boolean>(false);
  const [elapsedSecs, setElapsedSecs] = useState<number>(0);
  const [mistakeCount, setMistakeCount] = useState<number>(0);
  const [arcadeLives, setArcadeLives] = useState<number>(3);
  const [hasUsedCheck, setHasUsedCheck] = useState<boolean>(false);
  const [hintRemaining, setHintRemaining] = useState<number>(3);
  const [wrongCells, setWrongCells] = useState<Set<string>>(new Set());
  const [hintCell, setHintCell] = useState<{ row: number; col: number; target: 1 | 2 } | null>(null);

  // Undo and Redo histories
  const [undoStack, setUndoStack] = useState<number[][][]>([]);
  const [redoStack, setRedoStack] = useState<number[][][]>([]);

  // Modals
  const [showWinModal, setShowWinModal] = useState<boolean>(false);
  const [showPackModal, setShowPackModal] = useState<boolean>(false);
  const [showStatsModal, setShowStatsModal] = useState<boolean>(false);
  const [showStudioModal, setShowStudioModal] = useState<boolean>(false);
  const [showSettingsModal, setShowSettingsModal] = useState<boolean>(false);

  // Timer ref
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load new puzzle
  const loadPuzzle = useCallback(
    (newPuzzle: PuzzleDef, mode: GameMode = 'free') => {
      setPuzzle(newPuzzle);
      setGameMode(mode);
      setPlayerState(Array(newPuzzle.size).fill(0).map(() => Array(newPuzzle.size).fill(0)));
      setToolMode('fill');
      setIsPaused(false);
      setIsSolved(false);
      setElapsedSecs(0);
      setMistakeCount(0);
      setArcadeLives(3);
      setHasUsedCheck(false);
      setHintRemaining(mode === 'zen' ? 99 : 3);
      setWrongCells(new Set());
      setHintCell(null);
      setUndoStack([]);
      setRedoStack([]);
      setShowWinModal(false);
    },
    []
  );

  // Load daily puzzle on start or daily tab
  const loadDaily = useCallback(() => {
    const today = getTodayKey();
    const dailyPuzzle = generateDailyPuzzle(today);
    loadPuzzle(dailyPuzzle, 'daily');
    setCurrentTab('daily');
  }, [loadPuzzle]);

  // Load next random puzzle
  const loadNextPuzzle = useCallback(() => {
    if (gameMode === 'pack' && puzzle.packId) {
      const pack = PUZZLE_PACKS.find((p) => p.id === puzzle.packId);
      if (pack) {
        const currentIndex = pack.puzzles.findIndex((p) => p.id === puzzle.id);
        const nextIndex = (currentIndex + 1) % pack.puzzles.length;
        loadPuzzle(pack.puzzles[nextIndex], 'pack');
        return;
      }
    }
    const nextPuz = getRandomPuzzleBySize(puzzle.size, puzzle.id);
    loadPuzzle(nextPuz, gameMode);
  }, [gameMode, puzzle, loadPuzzle]);

  // Timer effect
  useEffect(() => {
    if (isSolved || isPaused || gameMode === 'zen') {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }

    timerRef.current = setInterval(() => {
      setElapsedSecs((prev) => prev + 1);
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isSolved, isPaused, gameMode]);

  // Clues for current puzzle
  const clues = cluesFor(puzzle.solution);

  // Completed pack puzzle ids set
  const completedPuzzleIds = new Set<string>();
  Object.values(stats.packProgress).forEach((ids) => {
    ids.forEach((id) => completedPuzzleIds.add(id));
  });

  // Calculate daily streak
  const dailyKeys = Object.keys(stats.dailyHistory).sort();
  let currentDailyStreak = 0;
  let streakCounter = 0;
  let prevD: Date | null = null;
  dailyKeys.forEach((key) => {
    const parts = key.split('-').map(Number);
    const d = new Date(parts[0], parts[1] - 1, parts[2], 12);
    if (prevD) {
      const diff = Math.round((d.getTime() - prevD.getTime()) / (1000 * 60 * 60 * 24));
      if (diff === 1) streakCounter++;
      else streakCounter = 1;
    } else {
      streakCounter = 1;
    }
    prevD = d;
  });
  const todayKey = getTodayKey();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;
  if (stats.dailyHistory[todayKey] || stats.dailyHistory[yesterdayKey]) {
    currentDailyStreak = streakCounter;
  }

  // Check victory condition
  const checkVictory = (state: number[][]): boolean => {
    for (let r = 0; r < puzzle.size; r++) {
      const rowFilled = state[r].map((v) => (v === 1 ? 1 : 0));
      if (!lineSatisfied(rowFilled, clues.rows[r])) return false;
    }
    for (let c = 0; c < puzzle.size; c++) {
      const colFilled = state.map((row) => (row[c] === 1 ? 1 : 0));
      if (!lineSatisfied(colFilled, clues.cols[c])) return false;
    }
    return true;
  };

  // Commit player moves (supports drag lines and single clicks)
  const handleCommitMove = (changes: { row: number; col: number; prev: number; next: number }[]) => {
    if (isSolved || changes.length === 0) return;

    // Save previous snapshot for undo
    setUndoStack((prev) => [...prev.slice(-30), playerState.map((r) => [...r])]);
    setRedoStack([]); // clear redo on new move

    // Create next state
    const nextState = playerState.map((r) => [...r]);
    let mistakeFound = false;

    changes.forEach(({ row, col, next }) => {
      nextState[row][col] = next;

      // In Arcade mode, mistakes cost lives immediately!
      if (gameMode === 'arcade' && next === 1 && puzzle.solution[row][col] !== 1) {
        mistakeFound = true;
      }
    });

    // Arcade penalty
    if (mistakeFound) {
      sfx.heartLost();
      setArcadeLives((lives) => {
        const nextLives = lives - 1;
        if (nextLives <= 0) {
          // Game Over alert
          setTimeout(() => {
            alert('Game Over! You ran out of hearts. Try again!');
            loadPuzzle(puzzle, 'arcade');
          }, 300);
        }
        return Math.max(0, nextLives);
      });
    }

    // Auto-X feature: automatically flag remaining cells in completed lines
    if (autoXEnabled) {
      let lineJustCompleted = false;

      // Check affected rows
      const checkedRows = new Set(changes.map((c) => c.row));
      checkedRows.forEach((r) => {
        const rowFilled = nextState[r].map((v) => (v === 1 ? 1 : 0));
        if (lineSatisfied(rowFilled, clues.rows[r])) {
          for (let c = 0; c < puzzle.size; c++) {
            if (nextState[r][c] === 0) {
              nextState[r][c] = 2; // Auto-flag
              lineJustCompleted = true;
            }
          }
        }
      });

      // Check affected cols
      const checkedCols = new Set(changes.map((c) => c.col));
      checkedCols.forEach((c) => {
        const colFilled = nextState.map((row) => (row[c] === 1 ? 1 : 0));
        if (lineSatisfied(colFilled, clues.cols[c])) {
          for (let r = 0; r < puzzle.size; r++) {
            if (nextState[r][c] === 0) {
              nextState[r][c] = 2; // Auto-flag
              lineJustCompleted = true;
            }
          }
        }
      });

      if (lineJustCompleted) {
        sfx.lineDone();
      }
    }

    setPlayerState(nextState);

    // Clear active hint or wrong markers on cell
    if (hintCell) setHintCell(null);
    if (wrongCells.size > 0) {
      setWrongCells(new Set());
    }

    // Check if won!
    if (checkVictory(nextState)) {
      setIsSolved(true);
      sfx.win();

      // Record statistics
      const isClean = !hasUsedCheck && mistakeCount === 0;
      const isBest = !stats.best[puzzle.size] || elapsedSecs < stats.best[puzzle.size].t;

      const newStats: PlayerStats = {
        ...stats,
        solved: stats.solved + 1,
        clean: isClean ? stats.clean + 1 : stats.clean,
        best: {
          ...stats.best,
          [puzzle.size]: isBest
            ? { t: elapsedSecs, clean: isClean }
            : stats.best[puzzle.size],
        },
        last: {
          ...stats.last,
          [puzzle.size]: { t: elapsedSecs, clean: isClean },
        },
        dailyHistory:
          gameMode === 'daily'
            ? {
                ...stats.dailyHistory,
                [getTodayKey()]: { t: elapsedSecs, clean: isClean, mistakes: mistakeCount },
              }
            : stats.dailyHistory,
        packProgress:
          puzzle.packId
            ? {
                ...stats.packProgress,
                [puzzle.packId]: Array.from(
                  new Set([...(stats.packProgress[puzzle.packId] || []), puzzle.id])
                ),
              }
            : stats.packProgress,
        solveLog: [
          ...stats.solveLog,
          {
            t: elapsedSecs,
            clean: isClean,
            mistakes: mistakeCount,
            timestamp: Date.now(),
            puzzleId: puzzle.id,
            puzzleName: puzzle.name,
            size: puzzle.size,
            mode: gameMode,
          },
        ],
      };

      saveStats(newStats);

      // Open win modal after ripple reveal finishes
      const delay = puzzle.size <= 5 ? 600 : puzzle.size <= 10 ? 800 : 1100;
      setTimeout(() => {
        setShowWinModal(true);
      }, delay);
    }
  };

  // Undo move
  const handleUndo = () => {
    if (undoStack.length === 0 || isSolved) return;
    const prev = undoStack[undoStack.length - 1];
    setRedoStack((r) => [...r, playerState.map((row) => [...row])]);
    setUndoStack((u) => u.slice(0, -1));
    setPlayerState(prev);
    sfx.undo();
  };

  // Redo move
  const handleRedo = () => {
    if (redoStack.length === 0 || isSolved) return;
    const next = redoStack[redoStack.length - 1];
    setUndoStack((u) => [...u, playerState.map((row) => [...row])]);
    setRedoStack((r) => r.slice(0, -1));
    setPlayerState(next);
    sfx.tick();
  };

  // Check mistakes on board
  const handleCheck = () => {
    if (isSolved) return;
    setHasUsedCheck(true);

    const wrong = new Set<string>();
    let count = 0;

    for (let r = 0; r < puzzle.size; r++) {
      for (let c = 0; c < puzzle.size; c++) {
        const val = playerState[r][c];
        const sol = puzzle.solution[r][c];
        // Wrong if filled when should be empty, or flagged when should be filled
        if ((val === 1 && sol !== 1) || (val === 2 && sol === 1)) {
          wrong.add(`${r},${c}`);
          count++;
        }
      }
    }

    setWrongCells(wrong);
    setMistakeCount((m) => m + count);

    if (count === 0) {
      sfx.checkClean();
    } else {
      sfx.checkBad();
    }
  };

  // Logical Hint
  const handleHint = () => {
    if (isSolved || hintRemaining <= 0) return;
    const hint = findLogicalHint(playerState, puzzle.solution, clues.rows, clues.cols);
    if (!hint) {
      alert('You have deduced everything possible right now! Check for any conflicts.');
      return;
    }

    setHintCell(hint);
    setHintRemaining((h) => Math.max(0, h - 1));
    sfx.hint();
  };

  // Reset board
  const handleReset = () => {
    if (isSolved) return;
    if (window.confirm('Reset this board to start fresh?')) {
      setPlayerState(Array(puzzle.size).fill(0).map(() => Array(puzzle.size).fill(0)));
      setUndoStack([]);
      setRedoStack([]);
      setWrongCells(new Set());
      setHintCell(null);
      sfx.erase();
    }
  };

  // Toggle Theme
  const handleCycleTheme = () => {
    const list: ThemeMode[] = ['matcha', 'midnight', 'retro', 'blueprint', 'coffee'];
    const idx = list.indexOf(theme);
    setTheme(list[(idx + 1) % list.length]);
  };

  // Toggle Sound
  const handleToggleSound = () => {
    const next = !soundOn;
    setSoundOn(next);
    setSoundEnabled(next);
    if (next) sfx.fill();
  };

  // Toggle Auto-X
  const handleToggleAutoX = () => {
    const next = !autoXEnabled;
    setAutoXEnabled(next);
    try {
      localStorage.setItem(AUTO_X_STORAGE_KEY, String(next));
    } catch {
      // ignore
    }
  };

  const isTodayDailyCompleted = !!stats.dailyHistory[getTodayKey()];

  return (
    <div className="min-h-screen flex flex-col justify-between selection:bg-[var(--accent)] selection:text-[var(--on-accent)]">
      {/* 3-Zone Top Navigation Bar */}
      <TopNav
        currentTab={currentTab}
        onSelectTab={(tab) => {
          setCurrentTab(tab);
          if (tab === 'packs') setShowPackModal(true);
          else if (tab === 'daily') loadDaily();
          else if (tab === 'studio') setShowStudioModal(true);
        }}
        gameMode={gameMode}
        onOpenStats={() => setShowStatsModal(true)}
        onOpenSettings={() => setShowSettingsModal(true)}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        theme={theme}
        onCycleTheme={handleCycleTheme}
        dailyStreak={currentDailyStreak}
      />

      {/* Main Play Viewport Area */}
      <main className="flex-1 w-full max-w-2xl mx-auto px-3 sm:px-4 py-3 flex flex-col justify-center items-center">
        {/* Daily Banner Card (if not yet played today or playing daily) */}
        {gameMode === 'daily' ? (
          <div className="w-full max-w-[580px] mb-2 p-2.5 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)] flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[var(--accent)]" />
              <span className="font-semibold text-xs sm:text-sm text-[var(--ink)]">Daily Challenge</span>
              <span className="text-[10px] text-[var(--muted)] font-mono-numbers">· {getTodayKey()}</span>
            </div>
            <div className="flex items-center gap-2">
              {isTodayDailyCompleted ? (
                <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Done</span>
                </span>
              ) : (
                <span className="text-xs font-semibold text-amber-600 flex items-center gap-1 font-mono-numbers">
                  <Flame className="w-3.5 h-3.5 fill-amber-500" />
                  <span>Streak: {currentDailyStreak}</span>
                </span>
              )}
            </div>
          </div>
        ) : (
          /* Subtle puzzle title & category descriptor */
          <div className="w-full max-w-[580px] mb-2 flex items-center justify-between px-1">
            <div className="flex items-center gap-2">
              <span className="font-display font-bold text-base sm:text-lg text-[var(--ink)] tracking-tight">
                {isSolved ? puzzle.name : `Mystery ${puzzle.size}×${puzzle.size}`}
              </span>
              {puzzle.author && (
                <span className="text-xs text-[var(--muted)]">by {puzzle.author}</span>
              )}
            </div>

            {/* Quick Difficulty / Size Selector */}
            <div className="flex items-center gap-1 bg-[var(--surface-subtle)] p-0.5 rounded-lg border border-[var(--grid-line)]">
              {[5, 10, 15].map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    const puz = getRandomPuzzleBySize(s);
                    loadPuzzle(puz, 'free');
                  }}
                  className={`px-2 py-0.5 rounded-md text-[11px] font-mono-numbers font-medium transition-colors ${
                    puzzle.size === s && gameMode === 'free'
                      ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
                      : 'text-[var(--muted)] hover:text-[var(--ink)]'
                  }`}
                >
                  {s}×{s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Nonogram Grid Board */}
        <Board
          size={puzzle.size}
          clues={clues}
          playerState={playerState}
          solution={puzzle.solution}
          colorMap={puzzle.colorMap}
          toolMode={toolMode}
          isSolved={isSolved}
          wrongCells={wrongCells}
          hintCell={hintCell}
          onCommitMove={handleCommitMove}
          autoXEnabled={autoXEnabled}
        />

        {/* Tactical Controls & Assists Bar */}
        <Controls
          toolMode={toolMode}
          onSetToolMode={setToolMode}
          canUndo={undoStack.length > 0}
          canRedo={redoStack.length > 0}
          onUndo={handleUndo}
          onRedo={handleRedo}
          onCheck={handleCheck}
          onHint={handleHint}
          onReset={handleReset}
          gameMode={gameMode}
          isPaused={isPaused}
          onTogglePause={() => setIsPaused((p) => !p)}
          elapsedSecs={elapsedSecs}
          mistakeCount={mistakeCount}
          arcadeLives={arcadeLives}
          isSolved={isSolved}
          hintRemaining={hintRemaining}
        />
      </main>

      {/* Subtle Footer with Clean Metadata */}
      <footer className="w-full py-2.5 px-4 text-center border-t border-[var(--grid-line)] text-xs text-[var(--muted)] flex items-center justify-center gap-2 select-none">
        <span>Nonogrid Deluxe</span>
        <span aria-hidden="true">·</span>
        <span>Pure Constraint Logic</span>
        <span aria-hidden="true">·</span>
        <span>Keyboard: Z = Fill, X = Flag, Arrows = Move</span>
      </footer>

      {/* Modals */}
      <WinModal
        puzzle={puzzle}
        elapsedSecs={elapsedSecs}
        isClean={!hasUsedCheck && mistakeCount === 0}
        isNewBest={!stats.best[puzzle.size] || elapsedSecs <= stats.best[puzzle.size].t}
        bestTime={stats.best[puzzle.size]?.t}
        isOpen={showWinModal}
        onClose={() => setShowWinModal(false)}
        onNext={loadNextPuzzle}
        onReplay={() => loadPuzzle(puzzle, gameMode)}
      />

      <PackSelectorModal
        isOpen={showPackModal}
        onClose={() => setShowPackModal(false)}
        onSelectPuzzle={(p) => {
          loadPuzzle(p, 'pack');
          setCurrentTab('play');
        }}
        completedPuzzleIds={completedPuzzleIds}
      />

      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        stats={stats}
      />

      <PuzzleStudioModal
        isOpen={showStudioModal}
        onClose={() => setShowStudioModal(false)}
        onPlayCustomPuzzle={(custom) => {
          loadPuzzle(custom, 'free');
          setCurrentTab('play');
        }}
      />

      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        theme={theme}
        onSelectTheme={setTheme}
        soundEnabled={soundOn}
        onToggleSound={handleToggleSound}
        autoXEnabled={autoXEnabled}
        onToggleAutoX={handleToggleAutoX}
        gameMode={gameMode}
        onSelectGameMode={(mode) => {
          setGameMode(mode);
          if (mode === 'zen') setHintRemaining(99);
          if (mode === 'arcade') setArcadeLives(3);
        }}
      />
    </div>
  );
}
