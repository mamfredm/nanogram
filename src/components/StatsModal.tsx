import React, { useState } from 'react';
import { X, Trophy, Flame, CheckCircle, Clock } from 'lucide-react';
import { PlayerStats, SolveRecord } from '../types';

interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  stats: PlayerStats;
}

function formatTime(total: number): string {
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, stats }) => {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'history'>('overview');

  if (!isOpen) return null;

  // Streak calculations
  const dailyKeys = Object.keys(stats.dailyHistory).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let run = 0;
  let prevDate: Date | null = null;

  dailyKeys.forEach((key) => {
    const parts = key.split('-').map(Number);
    const date = new Date(parts[0], parts[1] - 1, parts[2], 12);
    if (prevDate) {
      const diffDays = Math.round((date.getTime() - prevDate.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        run++;
      } else {
        run = 1;
      }
    } else {
      run = 1;
    }
    if (run > longestStreak) longestStreak = run;
    prevDate = date;
  });

  // Check if today or yesterday has a solve to count current streak
  const today = new Date();
  today.setHours(12, 0, 0, 0);
  const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth() + 1).padStart(2, '0')}-${String(yesterday.getDate()).padStart(2, '0')}`;

  if (stats.dailyHistory[todayKey] || stats.dailyHistory[yesterdayKey]) {
    currentStreak = run;
  } else {
    currentStreak = 0;
  }

  // Recent times for chart (last 15 solves)
  const recentSolves = stats.solveLog.slice(-15);
  const maxTime = recentSolves.length > 0 ? Math.max(...recentSolves.map((s) => s.t)) : 60;
  const avgTime = recentSolves.length > 0 ? Math.round(recentSolves.reduce((acc, s) => acc + s.t, 0) / recentSolves.length) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg max-h-[85vh] rounded-2xl bg-[var(--surface)] border border-[var(--grid-line)] shadow-[var(--lift)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--grid-line)]">
          <div className="flex items-center gap-2">
            <Trophy className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-display font-extrabold text-xl text-[var(--ink)]">Statistics & History</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex border-b border-[var(--grid-line)] bg-[var(--surface-subtle)] px-4 pt-2">
          <button
            onClick={() => setSelectedTab('overview')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              selectedTab === 'overview'
                ? 'border-[var(--accent)] text-[var(--ink)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setSelectedTab('history')}
            className={`pb-2 px-3 text-xs font-semibold border-b-2 transition-colors ${
              selectedTab === 'history'
                ? 'border-[var(--accent)] text-[var(--ink)]'
                : 'border-transparent text-[var(--muted)] hover:text-[var(--ink)]'
            }`}
          >
            Solve Log ({stats.solveLog.length})
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {selectedTab === 'overview' ? (
            <>
              {/* Stat Tiles */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <div className="p-3 rounded-xl border border-[var(--grid-line)] bg-[var(--surface-subtle)] text-center">
                  <div className="text-xl font-bold font-mono-numbers text-[var(--ink)]">{stats.solved}</div>
                  <div className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Puzzles Solved</div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--grid-line)] bg-[var(--surface-subtle)] text-center">
                  <div className="text-xl font-bold font-mono-numbers text-[var(--ink)]">{stats.clean}</div>
                  <div className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Clean Solves</div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--grid-line)] bg-[var(--surface-subtle)] text-center">
                  <div className="flex items-center justify-center gap-1 text-xl font-bold font-mono-numbers text-amber-500">
                    <Flame className="w-4 h-4 fill-amber-500" />
                    <span>{currentStreak}</span>
                  </div>
                  <div className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Daily Streak</div>
                </div>

                <div className="p-3 rounded-xl border border-[var(--grid-line)] bg-[var(--surface-subtle)] text-center">
                  <div className="text-xl font-bold font-mono-numbers text-[var(--ink)]">{longestStreak}</div>
                  <div className="text-[10px] text-[var(--muted)] font-medium mt-0.5">Longest Streak</div>
                </div>
              </div>

              {/* Best Times by Size */}
              <div className="p-3 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)]">
                <div className="text-xs font-semibold text-[var(--ink)] mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-[var(--muted)]" />
                  <span>Personal Best Times</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {[5, 10, 15].map((s) => (
                    <div key={s} className="p-2 rounded-lg bg-[var(--surface-subtle)] text-center">
                      <div className="text-[11px] text-[var(--muted)] font-medium">{s}×{s} Grid</div>
                      <div className="text-sm font-bold font-mono-numbers text-[var(--ink)] mt-0.5">
                        {stats.best[s] ? formatTime(stats.best[s].t) : '—'}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent Times Chart */}
              {recentSolves.length >= 2 && (
                <div className="p-3.5 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)]">
                  <div className="flex items-center justify-between text-xs font-semibold text-[var(--ink)] mb-3">
                    <span>Recent Solve Times</span>
                    <span className="text-[10px] text-[var(--muted)] font-mono-numbers">
                      Avg: {formatTime(avgTime)}
                    </span>
                  </div>

                  {/* SVG Bar Chart */}
                  <div className="h-28 w-full flex items-end gap-1.5 pt-2">
                    {recentSolves.map((s, idx) => {
                      const heightPercent = Math.max(8, (s.t / maxTime) * 100);
                      return (
                        <div key={idx} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                          {/* Tooltip */}
                          <div className="absolute -top-7 opacity-0 group-hover:opacity-100 transition-opacity bg-[var(--ink)] text-[var(--paper)] text-[9px] font-mono-numbers px-1.5 py-0.5 rounded pointer-events-none whitespace-nowrap z-10">
                            {formatTime(s.t)} ({s.size}×{s.size})
                          </div>
                          {/* Bar */}
                          <div
                            style={{ height: `${heightPercent}%` }}
                            className={`w-full rounded-t-sm transition-all ${
                              s.clean ? 'bg-emerald-500' : 'bg-[var(--grid-line-strong)]'
                            } group-hover:bg-[var(--accent)]`}
                          />
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-[var(--muted)] mt-2 font-mono-numbers">
                    <span>Oldest</span>
                    <span>Most Recent</span>
                  </div>
                </div>
              )}
            </>
          ) : (
            /* Detailed Solve History */
            <div className="space-y-1.5">
              {stats.solveLog.length === 0 ? (
                <div className="text-center py-8 text-xs text-[var(--muted)]">
                  No puzzles solved yet. Jump into a game to start logging times!
                </div>
              ) : (
                stats.solveLog
                  .slice()
                  .reverse()
                  .map((log: SolveRecord, i: number) => (
                    <div
                      key={i}
                      className="flex items-center justify-between p-2.5 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)] text-xs"
                    >
                      <div className="flex items-center gap-2">
                        {log.clean ? (
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border border-[var(--muted)] flex items-center justify-center text-[9px]">
                            {log.mistakes}
                          </div>
                        )}
                        <div>
                          <div className="font-semibold text-[var(--ink)]">
                            {log.puzzleName || `${log.size}×${log.size} Puzzle`}
                          </div>
                          <div className="text-[10px] text-[var(--muted)]">
                            {new Date(log.timestamp).toLocaleDateString()} · {log.size}×{log.size}
                          </div>
                        </div>
                      </div>

                      <div className="font-mono-numbers font-bold text-sm text-[var(--ink)]">
                        {formatTime(log.t)}
                      </div>
                    </div>
                  ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
