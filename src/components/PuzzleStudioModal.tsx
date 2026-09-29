import React, { useState } from 'react';
import { X, Play, Check, AlertCircle, Copy, Download, Eraser } from 'lucide-react';
import { PuzzleDef } from '../types';
import { cluesFor, isUniquelySolvable } from '../utils/solver';
import { generateColorMap } from '../utils/puzzles';

interface PuzzleStudioModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayCustomPuzzle: (puzzle: PuzzleDef) => void;
}

export const PuzzleStudioModal: React.FC<PuzzleStudioModalProps> = ({
  isOpen,
  onClose,
  onPlayCustomPuzzle,
}) => {
  const [size, setSize] = useState<number>(5);
  const [name, setName] = useState<string>('My Creation');
  const [grid, setGrid] = useState<number[][]>(() =>
    Array(5).fill(0).map(() => Array(5).fill(0))
  );
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError?: boolean } | null>(null);

  if (!isOpen) return null;

  const handleResize = (newSize: number) => {
    setSize(newSize);
    setGrid(Array(newSize).fill(0).map(() => Array(newSize).fill(0)));
    setStatusMessage(null);
  };

  const handleToggleCell = (r: number, c: number) => {
    setGrid((prev) => {
      const next = prev.map((row) => [...row]);
      next[r][c] = next[r][c] === 1 ? 0 : 1;
      return next;
    });
    setStatusMessage(null);
  };

  const handleClear = () => {
    setGrid(Array(size).fill(0).map(() => Array(size).fill(0)));
    setStatusMessage(null);
  };

  const handleValidate = () => {
    // Check if empty
    const filledCount = grid.flat().filter((x) => x === 1).length;
    if (filledCount === 0) {
      setStatusMessage({ text: 'Draw some pixels first!', isError: true });
      return;
    }

    const uniquelySolvable = isUniquelySolvable(grid);
    if (uniquelySolvable) {
      setStatusMessage({ text: '✓ 100% Uniquely Solvable by pure logic! Ready to play.', isError: false });
    } else {
      setStatusMessage({
        text: '⚠ Clues have multiple solutions or require guessing. Try tweaking a few pixels!',
        isError: true,
      });
    }
  };

  const handlePlay = () => {
    const filledCount = grid.flat().filter((x) => x === 1).length;
    if (filledCount === 0) {
      setStatusMessage({ text: 'Please fill at least one cell!', isError: true });
      return;
    }

    const puzzle: PuzzleDef = {
      id: `custom_${Date.now()}`,
      name: name.trim() || 'Custom Artwork',
      size,
      solution: grid,
      colorMap: generateColorMap(name, grid),
      author: 'You',
    };

    onPlayCustomPuzzle(puzzle);
    onClose();
  };

  const handleExport = () => {
    const encoded = grid.map((r) => r.join('')).join('|');
    navigator.clipboard.writeText(encoded);
    setStatusMessage({ text: 'Copied puzzle code to clipboard!', isError: false });
  };

  const currentClues = cluesFor(grid);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[90vh] rounded-2xl bg-[var(--surface)] border border-[var(--grid-line)] shadow-[var(--lift)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--grid-line)]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-purple-500" />
            <h2 className="font-display font-extrabold text-xl text-[var(--ink)]">Puzzle Studio</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Studio Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-[var(--surface-subtle)] border-b border-[var(--grid-line)] text-xs">
          {/* Name Input */}
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Puzzle Name"
            maxLength={24}
            className="px-2.5 py-1.5 rounded-lg border border-[var(--grid-line)] bg-[var(--surface)] text-[var(--ink)] font-medium focus:outline-none focus:border-[var(--accent)]"
          />

          {/* Size Select */}
          <div className="flex items-center gap-1">
            {[5, 10, 15].map((s) => (
              <button
                key={s}
                onClick={() => handleResize(s)}
                className={`px-2.5 py-1.5 rounded-lg font-mono-numbers font-semibold transition-colors ${
                  size === s
                    ? 'bg-[var(--ink)] text-[var(--paper)]'
                    : 'bg-[var(--surface)] text-[var(--muted)] border border-[var(--grid-line)] hover:text-[var(--ink)]'
                }`}
              >
                {s}×{s}
              </button>
            ))}
          </div>

          {/* Clear button */}
          <button
            onClick={handleClear}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-[var(--grid-line)] bg-[var(--surface)] text-[var(--muted)] hover:text-red-500 hover:border-red-300 transition-colors"
          >
            <Eraser className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>

        {/* Drawing Board */}
        <div className="flex-1 overflow-y-auto p-4 flex flex-col items-center justify-center">
          <div className="flex items-start gap-1 p-2 rounded-xl bg-[var(--paper)] border border-[var(--grid-line)] shadow-inner">
            {/* Clues + Canvas Area */}
            <div className="flex flex-col">
              {/* Column Clues */}
              <div
                className="grid mb-1 pl-12"
                style={{
                  gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                  width: `${size * (size <= 5 ? 36 : size <= 10 ? 24 : 16) + 48}px`,
                }}
              >
                {currentClues.cols.map((col, idx) => (
                  <div key={idx} className="flex flex-col items-center justify-end text-[9px] font-mono-numbers text-[var(--muted)]">
                    {col.map((num, i) => (
                      <span key={i}>{num}</span>
                    ))}
                  </div>
                ))}
              </div>

              {/* Row Clues + Grid */}
              <div className="flex">
                {/* Row Clues */}
                <div
                  className="w-12 flex flex-col justify-around pr-2 text-right text-[9px] font-mono-numbers text-[var(--muted)]"
                >
                  {currentClues.rows.map((row, idx) => (
                    <div key={idx} className="flex items-center justify-end gap-1">
                      {row.map((num, i) => (
                        <span key={i}>{num}</span>
                      ))}
                    </div>
                  ))}
                </div>

                {/* Pixel Grid */}
                <div
                  className="grid border-2 border-[var(--grid-line-strong)] rounded-lg overflow-hidden bg-[var(--surface)]"
                  style={{
                    gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
                    width: `${size * (size <= 5 ? 36 : size <= 10 ? 24 : 16)}px`,
                    height: `${size * (size <= 5 ? 36 : size <= 10 ? 24 : 16)}px`,
                  }}
                >
                  {grid.map((row, r) =>
                    row.map((val, c) => (
                      <button
                        key={`${r}-${c}`}
                        onClick={() => handleToggleCell(r, c)}
                        className={`aspect-square border border-[var(--grid-line)] transition-colors ${
                          val === 1 ? 'bg-[var(--ink)]' : 'bg-transparent hover:bg-[var(--surface-subtle)]'
                        }`}
                      />
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Validation Status Message */}
          {statusMessage && (
            <div
              className={`mt-3 px-3 py-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 ${
                statusMessage.isError
                  ? 'bg-amber-100 dark:bg-amber-950/60 text-amber-800 dark:text-amber-200'
                  : 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-200'
              }`}
            >
              {statusMessage.isError ? <AlertCircle className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
              <span>{statusMessage.text}</span>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-3 border-t border-[var(--grid-line)] bg-[var(--surface)] flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              onClick={handleValidate}
              className="px-3 py-2 rounded-xl border border-[var(--grid-line)] text-xs font-semibold text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
            >
              Test Solvability
            </button>
            <button
              onClick={handleExport}
              className="p-2 rounded-xl border border-[var(--grid-line)] text-xs font-medium text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
              title="Copy Code"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <button
            onClick={handlePlay}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[var(--ink)] text-[var(--paper)] text-xs font-semibold hover:opacity-90 transition-opacity"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span>Play Puzzle</span>
          </button>
        </div>
      </div>
    </div>
  );
};
