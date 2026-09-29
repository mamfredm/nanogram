import React from 'react';
import { Undo2, Redo2, HelpCircle, CheckCircle, Pause, Play, Heart, Sparkles, RefreshCw } from 'lucide-react';
import { GameMode, ToolMode } from '../types';

interface ControlsProps {
  toolMode: ToolMode;
  onSetToolMode: (mode: ToolMode) => void;
  canUndo: boolean;
  canRedo: boolean;
  onUndo: () => void;
  onRedo: () => void;
  onCheck: () => void;
  onHint: () => void;
  onReset: () => void;
  gameMode: GameMode;
  isPaused: boolean;
  onTogglePause: () => void;
  elapsedSecs: number;
  mistakeCount: number;
  arcadeLives: number;
  isSolved: boolean;
  hintRemaining: number;
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const Controls: React.FC<ControlsProps> = ({
  toolMode,
  onSetToolMode,
  canUndo,
  canRedo,
  onUndo,
  onRedo,
  onCheck,
  onHint,
  onReset,
  gameMode,
  isPaused,
  onTogglePause,
  elapsedSecs,
  mistakeCount,
  arcadeLives,
  isSolved,
  hintRemaining,
}) => {
  return (
    <div className="w-full max-w-[580px] mx-auto flex flex-col gap-2 mt-3 select-none">
      {/* Top Controls Row: Primary Tool Modes & Timer/Status */}
      <div className="flex items-center justify-between gap-2">
        {/* Fill vs Flag Mode Toggle */}
        <div className="inline-flex rounded-xl p-1 bg-[var(--surface-subtle)] border border-[var(--grid-line)] shadow-sm">
          <button
            onClick={() => onSetToolMode('fill')}
            aria-pressed={toolMode === 'fill'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              toolMode === 'fill'
                ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <span className="w-3.5 h-3.5 rounded-sm bg-current inline-block" />
            <span>Fill</span>
            <span className="text-[10px] opacity-60 hidden sm:inline">(Z)</span>
          </button>

          <button
            onClick={() => onSetToolMode('flag')}
            aria-pressed={toolMode === 'flag'}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              toolMode === 'flag'
                ? 'bg-[var(--ink)] text-[var(--paper)] shadow-sm'
                : 'text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
              <line x1="5" y1="5" x2="19" y2="19" />
              <line x1="19" y1="5" x2="5" y2="19" />
            </svg>
            <span>Flag</span>
            <span className="text-[10px] opacity-60 hidden sm:inline">(X)</span>
          </button>
        </div>

        {/* Center / Right: Mode Indicator & Timer */}
        <div className="flex items-center gap-3">
          {/* Arcade Mode Hearts */}
          {gameMode === 'arcade' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--grid-line)]">
              {[0, 1, 2].map((i) => (
                <Heart
                  key={i}
                  className={`w-4 h-4 transition-colors ${
                    i < arcadeLives ? 'text-red-500 fill-red-500' : 'text-slate-300 dark:text-slate-700'
                  }`}
                />
              ))}
            </div>
          )}

          {/* Zen Mode Indicator */}
          {gameMode === 'zen' && (
            <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[var(--surface-subtle)] border border-[var(--grid-line)] text-xs text-[var(--muted)]">
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              <span className="font-medium">Zen</span>
            </div>
          )}

          {/* Standard Timer & Pause */}
          {gameMode !== 'zen' && (
            <button
              onClick={onTogglePause}
              disabled={isSolved}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)] text-sm font-mono-numbers transition-colors ${
                isPaused ? 'text-[var(--accent)] border-[var(--accent)]' : 'text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
              }`}
              title={isPaused ? 'Resume Game' : 'Pause Game'}
            >
              {isPaused ? <Play className="w-3.5 h-3.5 fill-current" /> : <Pause className="w-3.5 h-3.5 fill-current" />}
              <span className="font-semibold">{formatTime(elapsedSecs)}</span>
            </button>
          )}
        </div>
      </div>

      {/* Action Buttons Row: Undo, Redo, Hint, Check, Reset */}
      <div className="flex items-center justify-between gap-1 sm:gap-2">
        {/* Undo & Redo group */}
        <div className="flex items-center gap-1">
          <button
            onClick={onUndo}
            disabled={!canUndo || isSolved}
            className="p-2 rounded-lg border border-[var(--grid-line)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--surface-subtle)] transition-colors"
            title="Undo (U / Ctrl+Z)"
            aria-label="Undo move"
          >
            <Undo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onRedo}
            disabled={!canRedo || isSolved}
            className="p-2 rounded-lg border border-[var(--grid-line)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-35 disabled:cursor-not-allowed hover:bg-[var(--surface-subtle)] transition-colors"
            title="Redo (Ctrl+Y)"
            aria-label="Redo move"
          >
            <Redo2 className="w-4 h-4" />
          </button>

          <button
            onClick={onReset}
            disabled={isSolved}
            className="p-2 rounded-lg border border-[var(--grid-line)] bg-[var(--surface)] text-[var(--ink)] disabled:opacity-35 hover:bg-[var(--surface-subtle)] transition-colors"
            title="Reset Board"
            aria-label="Reset puzzle"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>

        {/* Check & Hint group */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Smart Hint Button */}
          <button
            onClick={onHint}
            disabled={isSolved || hintRemaining <= 0}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--grid-line)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)] disabled:opacity-35 hover:bg-[var(--surface-subtle)] transition-colors"
            title="Get logical hint"
          >
            <HelpCircle className="w-4 h-4 text-amber-500" />
            <span>Hint</span>
            {hintRemaining < 99 && (
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.2 rounded-full bg-[var(--surface-subtle)] text-[var(--muted)]">
                {hintRemaining}
              </span>
            )}
          </button>

          {/* Check Errors Button */}
          <button
            onClick={onCheck}
            disabled={isSolved}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-[var(--grid-line-strong)] bg-[var(--surface)] text-xs font-semibold text-[var(--ink)] hover:border-[var(--ink)] transition-colors shadow-sm"
          >
            <CheckCircle className="w-4 h-4 text-emerald-600" />
            <span>Check</span>
            {mistakeCount > 0 && (
              <span className="text-[10px] font-mono-numbers px-1.5 py-0.2 rounded-full bg-red-100 dark:bg-red-950 text-red-600 font-bold">
                {mistakeCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
