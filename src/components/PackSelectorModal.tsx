import React, { useState } from 'react';
import { X, Check, Sparkles, Trees, Compass, Gamepad2, ChevronRight } from 'lucide-react';
import { PuzzleDef, PuzzlePack } from '../types';
import { PUZZLE_PACKS } from '../utils/puzzles';

interface PackSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPuzzle: (puzzle: PuzzleDef) => void;
  completedPuzzleIds: Set<string>;
}

export const PackSelectorModal: React.FC<PackSelectorModalProps> = ({
  isOpen,
  onClose,
  onSelectPuzzle,
  completedPuzzleIds,
}) => {
  const [selectedPackId, setSelectedPackId] = useState<string>('starter');

  if (!isOpen) return null;

  const activePack = PUZZLE_PACKS.find((p) => p.id === selectedPackId) || PUZZLE_PACKS[0];

  const getPackIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-amber-500" />;
      case 'Trees':
        return <Trees className="w-5 h-5 text-emerald-600" />;
      case 'Compass':
        return <Compass className="w-5 h-5 text-sky-500" />;
      case 'Gamepad2':
        return <Gamepad2 className="w-5 h-5 text-purple-500" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-xl max-h-[85vh] rounded-2xl bg-[var(--surface)] border border-[var(--grid-line)] shadow-[var(--lift)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--grid-line)]">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)]" />
            <h2 className="font-display font-extrabold text-xl text-[var(--ink)]">Level Packs</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Pack Selector Tabs */}
        <div className="flex p-2 gap-1.5 overflow-x-auto border-b border-[var(--grid-line)] bg-[var(--surface-subtle)]">
          {PUZZLE_PACKS.map((pack) => {
            const completedCount = pack.puzzles.filter((p) => completedPuzzleIds.has(p.id)).length;
            const isCurrent = pack.id === selectedPackId;

            return (
              <button
                key={pack.id}
                onClick={() => setSelectedPackId(pack.id)}
                className={`flex-1 min-w-[120px] flex items-center gap-2 p-2 rounded-xl text-left transition-all ${
                  isCurrent
                    ? 'bg-[var(--surface)] text-[var(--ink)] shadow-sm border border-[var(--grid-line)] font-semibold'
                    : 'text-[var(--muted)] hover:text-[var(--ink)]'
                }`}
              >
                {getPackIcon(pack.icon)}
                <div className="min-w-0 flex-1">
                  <div className="text-xs truncate">{pack.title}</div>
                  <div className="text-[10px] opacity-70 font-mono-numbers">
                    {completedCount}/{pack.puzzles.length}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Puzzle Grid List */}
        <div className="flex-1 overflow-y-auto p-4 grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {activePack.puzzles.map((puzzle, index) => {
            const isCompleted = completedPuzzleIds.has(puzzle.id);

            return (
              <button
                key={puzzle.id}
                onClick={() => {
                  onSelectPuzzle(puzzle);
                  onClose();
                }}
                className="group flex flex-col p-3 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)] hover:border-[var(--ink)] hover:shadow-sm text-left transition-all relative overflow-hidden"
              >
                <div className="flex items-center justify-between w-full mb-1">
                  <span className="text-[10px] font-mono-numbers text-[var(--muted)]">
                    #{index + 1} · {puzzle.size}×{puzzle.size}
                  </span>
                  {isCompleted && (
                    <span className="w-4 h-4 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 flex items-center justify-center">
                      <Check className="w-3 h-3 stroke-[3]" />
                    </span>
                  )}
                </div>

                <div className="font-semibold text-xs sm:text-sm text-[var(--ink)] group-hover:text-[var(--accent)] transition-colors truncate">
                  {puzzle.name}
                </div>

                <div className="flex items-center text-[10px] text-[var(--muted)] mt-2 group-hover:translate-x-0.5 transition-transform">
                  <span>Play</span>
                  <ChevronRight className="w-3 h-3 ml-0.5" />
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
