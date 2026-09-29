import React, { useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';
import { Trophy, Sparkles, ArrowRight, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';
import { PuzzleDef } from '../types';

interface WinModalProps {
  puzzle: PuzzleDef;
  elapsedSecs: number;
  isClean: boolean;
  isNewBest: boolean;
  bestTime?: number;
  isOpen: boolean;
  onClose: () => void;
  onNext: () => void;
  onReplay: () => void;
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const WinModal: React.FC<WinModalProps> = ({
  puzzle,
  elapsedSecs,
  isClean,
  isNewBest,
  bestTime,
  isOpen,
  onClose,
  onNext,
  onReplay,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // Trigger confetti burst on open
  useEffect(() => {
    if (isOpen) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.65 },
          colors: ['#15803d', '#38bdf8', '#fbbf24', '#ec4899', '#d2472f'],
        });
      } catch {
        // ignore
      }
    }
  }, [isOpen]);

  // Render revealed miniature pixel art on canvas
  useEffect(() => {
    if (!isOpen || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const n = puzzle.size;
    const pixelSize = Math.floor(canvas.width / n);

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (puzzle.solution[r][c] === 1) {
          ctx.fillStyle = puzzle.colorMap ? puzzle.colorMap[r][c] : '#1e2a20';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize - 1, pixelSize - 1);
        } else {
          ctx.fillStyle = 'rgba(0, 0, 0, 0.04)';
          ctx.fillRect(c * pixelSize, r * pixelSize, pixelSize - 1, pixelSize - 1);
        }
      }
    }
  }, [isOpen, puzzle]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-sm rounded-2xl bg-[var(--surface)] border border-[var(--grid-line-strong)] shadow-[var(--lift)] p-6 flex flex-col items-center gap-4 text-center">
        {/* Top Trophy Badge */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-[var(--accent-light)] text-[var(--accent)] text-xs font-semibold">
          <Trophy className="w-4 h-4" />
          <span>PUZZLE SOLVED</span>
        </div>

        {/* Puzzle Artwork Title */}
        <h2 className="font-display font-extrabold text-2xl tracking-tight text-[var(--ink)]">
          {puzzle.name}
        </h2>

        {/* Miniature Revealed Canvas Preview */}
        <div className="p-2.5 rounded-xl border border-[var(--grid-line)] bg-[var(--paper)] shadow-inner">
          <canvas ref={canvasRef} width={140} height={140} className="w-[140px] h-[140px] rounded-lg" />
        </div>

        {/* Stats Summary */}
        <div className="w-full grid grid-cols-2 gap-2 border-y border-[var(--grid-line)] py-3">
          <div>
            <div className="text-xs text-[var(--muted)]">Your Time</div>
            <div className="font-mono-numbers text-xl font-bold text-[var(--ink)]">
              {formatTime(elapsedSecs)}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--muted)]">Best Time</div>
            <div className="font-mono-numbers text-xl font-bold text-[var(--ink)]">
              {bestTime ? formatTime(bestTime) : formatTime(elapsedSecs)}
            </div>
          </div>
        </div>

        {/* Badges */}
        <div className="flex flex-wrap items-center justify-center gap-2">
          {isClean && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Clean Solve (No Checks)</span>
            </span>
          )}
          {isNewBest && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 dark:text-amber-400 bg-amber-100 dark:bg-amber-950/60 px-2.5 py-0.5 rounded-full">
              <Sparkles className="w-3.5 h-3.5" />
              <span>New Personal Best!</span>
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="w-full flex flex-col gap-2 mt-2">
          <button
            onClick={onNext}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-[var(--ink)] text-[var(--paper)] font-semibold text-sm hover:opacity-95 transition-opacity shadow-sm"
          >
            <span>Next Puzzle</span>
            <ArrowRight className="w-4 h-4" />
          </button>

          <div className="w-full flex items-center gap-2">
            <button
              onClick={onReplay}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--grid-line)] text-[var(--ink)] text-xs font-medium hover:bg-[var(--surface-subtle)] transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Replay</span>
            </button>

            <button
              onClick={onClose}
              className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-xl border border-[var(--grid-line)] text-[var(--ink)] text-xs font-medium hover:bg-[var(--surface-subtle)] transition-colors"
            >
              <Eye className="w-3.5 h-3.5" />
              <span>Admire Board</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
