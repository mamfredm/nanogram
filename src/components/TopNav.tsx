import React from 'react';
import { Volume2, VolumeX, Palette, BarChart3, Settings, Sparkles, Calendar, Layers, Paintbrush } from 'lucide-react';
import { GameMode, ThemeMode } from '../types';

interface TopNavProps {
  currentTab: 'play' | 'packs' | 'daily' | 'studio';
  onSelectTab: (tab: 'play' | 'packs' | 'daily' | 'studio') => void;
  gameMode: GameMode;
  onOpenStats: () => void;
  onOpenSettings: () => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  theme: ThemeMode;
  onCycleTheme: () => void;
  dailyStreak: number;
}

export const TopNav: React.FC<TopNavProps> = ({
  currentTab,
  onSelectTab,
  onOpenStats,
  onOpenSettings,
  soundEnabled,
  onToggleSound,
  dailyStreak,
}) => {
  return (
    <header className="w-full flex items-center justify-between py-3 px-3 md:px-5 border-b border-[var(--grid-line)] bg-[var(--surface)] text-[var(--ink)] shadow-[var(--shadow)] select-none">
      {/* Zone 1: Single text element brand */}
      <div className="flex items-center gap-2">
        <button
          onClick={() => onSelectTab('play')}
          className="font-display font-extrabold text-lg md:text-xl tracking-tight text-[var(--ink)] flex items-center gap-1.5 hover:opacity-90 transition-opacity"
        >
          <span className="w-2.5 h-2.5 rounded-sm bg-[var(--accent)] inline-block"></span>
          NONOGRID
          <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-[var(--accent-light)] text-[var(--accent)] tracking-normal">
            DELUXE
          </span>
        </button>
      </div>

      {/* Zone 2: Clean text navigation links */}
      <nav className="flex items-center gap-1 sm:gap-2 md:gap-4 text-xs sm:text-sm font-medium">
        <button
          onClick={() => onSelectTab('play')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            currentTab === 'play'
              ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Play</span>
        </button>

        <button
          onClick={() => onSelectTab('packs')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            currentTab === 'packs'
              ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Packs</span>
        </button>

        <button
          onClick={() => onSelectTab('daily')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap ${
            currentTab === 'daily'
              ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          <span>Daily</span>
          {dailyStreak > 0 && (
            <span className="text-[10px] font-mono-numbers px-1 rounded-full bg-[var(--accent)] text-[var(--on-accent)]">
              {dailyStreak}
            </span>
          )}
        </button>

        <button
          onClick={() => onSelectTab('studio')}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg transition-colors whitespace-nowrap hidden sm:flex ${
            currentTab === 'studio'
              ? 'bg-[var(--ink)] text-[var(--paper)] font-semibold'
              : 'text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)]'
          }`}
        >
          <Paintbrush className="w-3.5 h-3.5" />
          <span>Studio</span>
        </button>
      </nav>

      {/* Zone 3: Primary action affordances */}
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          onClick={onToggleSound}
          aria-label={soundEnabled ? 'Mute audio' : 'Unmute audio'}
          className="p-1.5 sm:p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          title={soundEnabled ? 'Sound On' : 'Sound Muted'}
        >
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>

        <button
          onClick={onOpenStats}
          aria-label="View statistics and solve history"
          className="p-1.5 sm:p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          title="Statistics"
        >
          <BarChart3 className="w-4 h-4" />
        </button>

        <button
          onClick={onOpenSettings}
          aria-label="Open settings and themes"
          className="p-1.5 sm:p-2 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          title="Themes & Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
