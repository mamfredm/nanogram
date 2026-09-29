import React from 'react';
import { X, Palette, Volume2, VolumeX, Sparkles, Heart, Keyboard, Check, ShieldCheck } from 'lucide-react';
import { GameMode, ThemeMode } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  theme: ThemeMode;
  onSelectTheme: (theme: ThemeMode) => void;
  soundEnabled: boolean;
  onToggleSound: () => void;
  autoXEnabled: boolean;
  onToggleAutoX: () => void;
  gameMode: GameMode;
  onSelectGameMode: (mode: GameMode) => void;
}

const THEMES: { id: ThemeMode; name: string; desc: string; previewColor: string; textColor: string }[] = [
  { id: 'matcha', name: 'Matcha Paper', desc: 'Craft sage paper & forest ink', previewColor: '#c8d5be', textColor: '#1b261d' },
  { id: 'midnight', name: 'Midnight OLED', desc: 'Deep obsidian & electric cyan', previewColor: '#121814', textColor: '#38bdf8' },
  { id: 'retro', name: 'Game Boy Retro', desc: 'Nostalgic 4-tone LCD green', previewColor: '#8b956d', textColor: '#0f380f' },
  { id: 'blueprint', name: 'Blueprint Navy', desc: 'Architectural cyan & blueprint', previewColor: '#102a4c', textColor: '#fbbf24' },
  { id: 'coffee', name: 'Hazelnut Coffee', desc: 'Warm espresso & parchment', previewColor: '#ece5d8', textColor: '#78350f' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  theme,
  onSelectTheme,
  soundEnabled,
  onToggleSound,
  autoXEnabled,
  onToggleAutoX,
  gameMode,
  onSelectGameMode,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md max-h-[85vh] rounded-2xl bg-[var(--surface)] border border-[var(--grid-line)] shadow-[var(--lift)] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--grid-line)]">
          <div className="flex items-center gap-2">
            <Palette className="w-5 h-5 text-[var(--accent)]" />
            <h2 className="font-display font-extrabold text-xl text-[var(--ink)]">Themes & Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[var(--muted)] hover:text-[var(--ink)] hover:bg-[var(--surface-subtle)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5">
          {/* Visual Theme Selection */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2.5">
              Visual Palette
            </h3>
            <div className="grid grid-cols-1 gap-2">
              {THEMES.map((t) => {
                const isActive = theme === t.id;
                return (
                  <button
                    key={t.id}
                    onClick={() => onSelectTheme(t.id)}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-left transition-all ${
                      isActive
                        ? 'border-[var(--accent)] bg-[var(--surface-subtle)] shadow-xs'
                        : 'border-[var(--grid-line)] hover:border-[var(--grid-line-strong)]'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg border border-black/10 flex items-center justify-center text-xs font-bold shadow-xs"
                        style={{ backgroundColor: t.previewColor, color: t.textColor }}
                      >
                        #
                      </div>
                      <div>
                        <div className="text-sm font-semibold text-[var(--ink)]">{t.name}</div>
                        <div className="text-xs text-[var(--muted)]">{t.desc}</div>
                      </div>
                    </div>
                    {isActive && <Check className="w-4 h-4 text-[var(--accent)] stroke-[3]" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Game Mode Selection */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2.5">
              Play Style
            </h3>
            <div className="grid grid-cols-3 gap-2">
              <button
                onClick={() => onSelectGameMode('free')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  gameMode === 'free'
                    ? 'border-[var(--accent)] bg-[var(--surface-subtle)] font-semibold'
                    : 'border-[var(--grid-line)] hover:border-[var(--grid-line-strong)]'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--ink)]">Standard</div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">Classic timer</div>
              </button>

              <button
                onClick={() => onSelectGameMode('zen')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  gameMode === 'zen'
                    ? 'border-[var(--accent)] bg-[var(--surface-subtle)] font-semibold'
                    : 'border-[var(--grid-line)] hover:border-[var(--grid-line-strong)]'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--ink)] flex items-center justify-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" />
                  <span>Zen</span>
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">No time pressure</div>
              </button>

              <button
                onClick={() => onSelectGameMode('arcade')}
                className={`p-2.5 rounded-xl border text-center transition-all ${
                  gameMode === 'arcade'
                    ? 'border-[var(--accent)] bg-[var(--surface-subtle)] font-semibold'
                    : 'border-[var(--grid-line)] hover:border-[var(--grid-line-strong)]'
                }`}
              >
                <div className="text-xs font-semibold text-[var(--ink)] flex items-center justify-center gap-1">
                  <Heart className="w-3 h-3 text-red-500 fill-red-500" />
                  <span>Arcade</span>
                </div>
                <div className="text-[10px] text-[var(--muted)] mt-0.5">3 Lives / Hearts</div>
              </button>
            </div>
          </div>

          {/* Gameplay Assists */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2.5">
              Assists & Audio
            </h3>
            <div className="space-y-2">
              {/* Sound Toggle */}
              <button
                onClick={onToggleSound}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--ink)]">
                  {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4 text-[var(--muted)]" />}
                  <span>Sound Effects</span>
                </div>
                <div className={`text-xs font-semibold ${soundEnabled ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                  {soundEnabled ? 'ON' : 'OFF'}
                </div>
              </button>

              {/* Auto-X Toggle */}
              <button
                onClick={onToggleAutoX}
                className="w-full flex items-center justify-between p-2.5 rounded-xl border border-[var(--grid-line)] bg-[var(--surface)] hover:bg-[var(--surface-subtle)] transition-colors"
              >
                <div className="flex items-center gap-2.5 text-xs font-semibold text-[var(--ink)]">
                  <ShieldCheck className="w-4 h-4 text-sky-500" />
                  <div className="text-left">
                    <div>Auto-Cross Completed Lines</div>
                    <div className="text-[10px] text-[var(--muted)] font-normal">Auto-flags remaining cells when a line is solved</div>
                  </div>
                </div>
                <div className={`text-xs font-semibold ${autoXEnabled ? 'text-[var(--accent)]' : 'text-[var(--muted)]'}`}>
                  {autoXEnabled ? 'ON' : 'OFF'}
                </div>
              </button>
            </div>
          </div>

          {/* Keyboard Shortcuts Legend */}
          <div>
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[var(--muted)] mb-2.5 flex items-center gap-1.5">
              <Keyboard className="w-3.5 h-3.5" />
              <span>Keyboard Shortcuts</span>
            </h3>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-[var(--muted)]">
              <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex justify-between">
                <span>Move Cursor:</span>
                <span className="font-mono-numbers font-semibold text-[var(--ink)]">Arrows / WASD</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex justify-between">
                <span>Fill Cell:</span>
                <span className="font-mono-numbers font-semibold text-[var(--ink)]">Space / Z</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex justify-between">
                <span>Flag (X):</span>
                <span className="font-mono-numbers font-semibold text-[var(--ink)]">X / C</span>
              </div>
              <div className="p-2 rounded-lg bg-[var(--surface-subtle)] flex justify-between">
                <span>Undo / Redo:</span>
                <span className="font-mono-numbers font-semibold text-[var(--ink)]">U / Ctrl+Z</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
