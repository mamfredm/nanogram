import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check } from 'lucide-react';
import { ClueSet, ToolMode } from '../types';
import { lineSatisfied } from '../utils/solver';
import { sfx } from '../utils/audio';

interface BoardProps {
  size: number;
  clues: ClueSet;
  playerState: number[][]; // 0 = empty, 1 = filled, 2 = flag (X)
  solution: number[][];
  colorMap?: string[][];
  toolMode: ToolMode;
  isSolved: boolean;
  wrongCells: Set<string>; // "r,c" of checked mistakes
  hintCell: { row: number; col: number; target: 1 | 2 } | null;
  onCommitMove: (changes: { row: number; col: number; prev: number; next: number }[]) => void;
  autoXEnabled: boolean;
}

interface StrokeState {
  mode: ToolMode;
  target: 1 | 2;
  action: 'set' | 'erase';
  start: [number, number];
  current: [number, number];
  pointerId: number;
  lastLen: number;
}

export const Board: React.FC<BoardProps> = ({
  size,
  clues,
  playerState,
  solution,
  colorMap,
  toolMode,
  isSolved,
  wrongCells,
  hintCell,
  onCommitMove,
  autoXEnabled,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [hoveredCell, setHoveredCell] = useState<[number, number] | null>(null);
  const [stroke, setStroke] = useState<StrokeState | null>(null);

  // Line satisfaction status
  const rowStatus = clues.rows.map((clue, r) =>
    lineSatisfied(playerState[r].map((v) => (v === 1 ? 1 : 0)), clue)
  );
  const colStatus = clues.cols.map((clue, c) =>
    lineSatisfied(playerState.map((row) => (row[c] === 1 ? 1 : 0)), clue)
  );

  // Determine which cells are part of current drag stroke
  const getStrokeLine = useCallback(
    (s: StrokeState): [number, number][] => {
      const [sr, sc] = s.start;
      const [cr, cc] = s.current;
      const dr = cr - sr;
      const dc = cc - sc;

      if (dr === 0 && dc === 0) return [[sr, sc]];

      // Lock to dominant axis (horizontal vs vertical)
      const isHorizontal = Math.abs(dc) >= Math.abs(dr);
      const line: [number, number][] = [];

      if (isHorizontal) {
        const step = dc > 0 ? 1 : -1;
        for (let c = sc; c !== cc + step; c += step) {
          line.push([sr, c]);
        }
      } else {
        const step = dr > 0 ? 1 : -1;
        for (let r = sr; r !== cr + step; r += step) {
          line.push([r, sc]);
        }
      }
      return line;
    },
    []
  );

  const activeStrokeLine = stroke ? getStrokeLine(stroke) : [];
  const strokeMap = new Map<string, boolean>();
  activeStrokeLine.forEach(([r, c]) => {
    strokeMap.set(`${r},${c}`, true);
  });

  // Cell coordinates from pointer position
  const getCellFromPoint = (clientX: number, clientY: number, clamp = false): [number, number] | null => {
    if (!containerRef.current) return null;
    const boardEl = containerRef.current.querySelector('.grid-board');
    if (!boardEl) return null;

    const rect = boardEl.getBoundingClientRect();
    const cellWidth = rect.width / size;
    const cellHeight = rect.height / size;

    const col = Math.floor((clientX - rect.left) / cellWidth);
    const row = Math.floor((clientY - rect.top) / cellHeight);

    if (!clamp && (row < 0 || col < 0 || row >= size || col >= size)) return null;

    const clampedRow = Math.max(0, Math.min(size - 1, row));
    const clampedCol = Math.max(0, Math.min(size - 1, col));
    return [clampedRow, clampedCol];
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (isSolved) return;
    const cell = getCellFromPoint(e.clientX, e.clientY);
    if (!cell) return;

    e.preventDefault();
    const [r, c] = cell;
    const isRightClick = e.button === 2 || e.buttons === 2;
    const effectiveMode: ToolMode = isRightClick ? 'flag' : toolMode;
    const targetVal: 1 | 2 = effectiveMode === 'fill' ? 1 : 2;
    const currentVal = playerState[r][c];

    const action = currentVal === targetVal ? 'erase' : 'set';

    const newStroke: StrokeState = {
      mode: effectiveMode,
      target: targetVal,
      action,
      start: [r, c],
      current: [r, c],
      pointerId: e.pointerId,
      lastLen: 1,
    };

    setStroke(newStroke);
    sfx.tick();

    try {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    const cell = getCellFromPoint(e.clientX, e.clientY, !!stroke);
    if (cell) {
      setHoveredCell(cell);
    }

    if (!stroke || e.pointerId !== stroke.pointerId) return;
    if (!cell) return;

    const [r, c] = cell;
    if (r !== stroke.current[0] || c !== stroke.current[1]) {
      const updated = { ...stroke, current: cell as [number, number] };
      const line = getStrokeLine(updated);

      if (line.length !== stroke.lastLen) {
        sfx.dragNote(line.length - 1);
        updated.lastLen = line.length;
      }
      setStroke(updated);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!stroke || e.pointerId !== stroke.pointerId) return;

    const line = getStrokeLine(stroke);
    const nextVal = stroke.action === 'set' ? stroke.target : 0;
    const changes: { row: number; col: number; prev: number; next: number }[] = [];

    line.forEach(([r, c]) => {
      const cur = playerState[r][c];
      // Only change if applicable
      const isEligible = stroke.action === 'set' ? cur === 0 : cur === stroke.target;
      if (isEligible) {
        changes.push({ row: r, col: c, prev: cur, next: nextVal });
      }
    });

    if (changes.length > 0) {
      onCommitMove(changes);
      if (nextVal === 0) sfx.erase();
      else if (nextVal === 1) sfx.fill();
      else sfx.flag();
    }

    setStroke(null);
  };

  const handlePointerLeave = () => {
    if (!stroke) setHoveredCell(null);
  };

  // Keyboard navigation
  const [keyCursor, setKeyCursor] = useState<[number, number] | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (isSolved) return;
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'KeyW', 'KeyA', 'KeyS', 'KeyD'].includes(e.code)) {
        e.preventDefault();
        setKeyCursor((prev) => {
          const [r, c] = prev || [0, 0];
          let nr = r;
          let nc = c;
          if (e.code === 'ArrowUp' || e.code === 'KeyW') nr = Math.max(0, r - 1);
          if (e.code === 'ArrowDown' || e.code === 'KeyS') nr = Math.min(size - 1, r + 1);
          if (e.code === 'ArrowLeft' || e.code === 'KeyA') nc = Math.max(0, c - 1);
          if (e.code === 'ArrowRight' || e.code === 'KeyD') nc = Math.min(size - 1, c + 1);
          setHoveredCell([nr, nc]);
          sfx.tick();
          return [nr, nc];
        });
      } else if (e.code === 'Space' || e.code === 'KeyZ') {
        if (!keyCursor) return;
        e.preventDefault();
        const [r, c] = keyCursor;
        const cur = playerState[r][c];
        const next = cur === 1 ? 0 : 1;
        onCommitMove([{ row: r, col: c, prev: cur, next }]);
        if (next === 1) sfx.fill();
        else sfx.erase();
      } else if (e.code === 'KeyX' || e.code === 'KeyC') {
        if (!keyCursor) return;
        e.preventDefault();
        const [r, c] = keyCursor;
        const cur = playerState[r][c];
        const next = cur === 2 ? 0 : 2;
        onCommitMove([{ row: r, col: c, prev: cur, next }]);
        if (next === 2) sfx.flag();
        else sfx.erase();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [keyCursor, playerState, size, isSolved, onCommitMove]);

  // Dynamic font size and layout proportions based on grid size
  const clueFontSize = size <= 5 ? 'text-sm sm:text-base font-semibold' : size <= 10 ? 'text-xs sm:text-sm font-medium' : 'text-[10px] sm:text-xs font-medium';
  const cornerWidthClass = size <= 5 ? 'w-10 sm:w-16' : size <= 10 ? 'w-12 sm:w-20' : 'w-14 sm:w-24';
  const cornerHeightClass = size <= 5 ? 'h-10 sm:h-16' : size <= 10 ? 'h-14 sm:h-20' : 'h-16 sm:h-24';

  return (
    <div
      ref={containerRef}
      onContextMenu={(e) => e.preventDefault()}
      className="relative flex flex-col items-center select-none w-full max-w-[580px] mx-auto"
    >
      {/* Stroke line length indicator pill */}
      {stroke && activeStrokeLine.length >= 2 && (
        <div
          className="absolute -top-7 px-2.5 py-0.5 rounded-full bg-[var(--ink)] text-[var(--paper)] text-xs font-mono-numbers font-semibold shadow-md z-30 pointer-events-none transition-transform"
        >
          {activeStrokeLine.length} cells
        </div>
      )}

      {/* Main Board Structure */}
      <div className="w-full flex flex-col border border-[var(--grid-line)] rounded-xl sm:rounded-2xl p-2 sm:p-3.5 bg-[var(--surface)] shadow-[var(--shadow)] overflow-hidden">
        {/* Top Header Row: Corner spacer + Column Clues */}
        <div className="flex w-full">
          {/* Top-Left Corner */}
          <div
            className={`flex-none ${cornerWidthClass} ${cornerHeightClass} border-r-2 border-b-2 border-[var(--grid-line-strong)] bg-[var(--surface-subtle)] rounded-tl-lg flex items-center justify-center text-[var(--muted)] text-[10px] font-mono-numbers`}
          >
            {size}×{size}
          </div>

          {/* Column Clues */}
          <div className="flex-1 grid" style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}>
            {clues.cols.map((colClue, c) => {
              const isColDone = colStatus[c];
              const isColHovered = hoveredCell && hoveredCell[1] === c;
              const isThickRight = (c + 1) % 5 === 0 && c !== size - 1;

              return (
                <div
                  key={`col_${c}`}
                  className={`flex flex-col justify-end items-center pb-1.5 border-b-2 border-[var(--grid-line-strong)] transition-colors ${
                    isThickRight ? 'border-r-2 border-r-[var(--grid-line-strong)]' : 'border-r border-r-[var(--grid-line)]'
                  } ${isColHovered ? 'bg-[var(--cell-hover)]' : ''} ${isColDone ? 'text-[var(--clue-done)] opacity-60' : 'text-[var(--ink)] font-semibold'}`}
                >
                  {colClue.map((num, i) => (
                    <span key={i} className={`leading-tight font-mono-numbers ${clueFontSize}`}>
                      {num}
                    </span>
                  ))}
                  {isColDone && <Check className="w-2.5 h-2.5 text-[var(--success)] mt-0.5" />}
                </div>
              );
            })}
          </div>
        </div>

        {/* Board Rows: Row Clue + Cell row */}
        <div className="flex w-full">
          {/* Row Clues Column */}
          <div className={`flex-none ${cornerWidthClass} flex flex-col`}>
            {clues.rows.map((rowClue, r) => {
              const isRowDone = rowStatus[r];
              const isRowHovered = hoveredCell && hoveredCell[0] === r;
              const isThickBottom = (r + 1) % 5 === 0 && r !== size - 1;

              return (
                <div
                  key={`row_${r}`}
                  className={`flex-1 flex justify-end items-center pr-2 gap-1 sm:gap-1.5 border-r-2 border-[var(--grid-line-strong)] transition-colors ${
                    isThickBottom ? 'border-b-2 border-b-[var(--grid-line-strong)]' : 'border-b border-b-[var(--grid-line)]'
                  } ${isRowHovered ? 'bg-[var(--cell-hover)]' : ''} ${isRowDone ? 'text-[var(--clue-done)] opacity-60' : 'text-[var(--ink)] font-semibold'}`}
                >
                  {isRowDone && <Check className="w-2.5 h-2.5 text-[var(--success)] mr-0.5" />}
                  {rowClue.map((num, i) => (
                    <span key={i} className={`font-mono-numbers leading-none ${clueFontSize}`}>
                      {num}
                    </span>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Cell Grid Area */}
          <div
            className="grid-board flex-1 grid touch-none"
            style={{
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              gridTemplateRows: `repeat(${size}, minmax(0, 1fr))`,
            }}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerLeave}
          >
            {playerState.map((row, r) =>
              row.map((cellVal, c) => {
                const isThickRight = (c + 1) % 5 === 0 && c !== size - 1;
                const isThickBottom = (r + 1) % 5 === 0 && r !== size - 1;
                const coord = `${r},${c}`;
                const isWrong = wrongCells.has(coord);
                const isHint = hintCell && hintCell.row === r && hintCell.col === c;
                const inStroke = strokeMap.get(coord);

                // Preview calculation
                let previewVal = cellVal;
                if (inStroke && stroke) {
                  const isEligible = stroke.action === 'set' ? cellVal === 0 : cellVal === stroke.target;
                  if (isEligible) {
                    previewVal = stroke.action === 'set' ? stroke.target : 0;
                  }
                }

                // Crosshair guide detection
                const isCrosshair = hoveredCell && (hoveredCell[0] === r || hoveredCell[1] === c);
                const isCursor = keyCursor && keyCursor[0] === r && keyCursor[1] === c;

                // Color reveal when puzzle solved
                const revealColor = isSolved && solution[r][c] === 1 && colorMap ? colorMap[r][c] : null;

                return (
                  <div
                    key={coord}
                    data-row={r}
                    data-col={c}
                    style={{
                      backgroundColor: isSolved && solution[r][c] === 1
                        ? (revealColor || 'var(--ink)')
                        : previewVal === 1
                        ? 'var(--ink)'
                        : undefined,
                      animationDelay: isSolved ? `${(r + c) * (size <= 5 ? 35 : size <= 10 ? 20 : 12)}ms` : undefined,
                    }}
                    className={`relative aspect-square border border-[var(--grid-line)] transition-all cursor-pointer flex items-center justify-center select-none ${
                      isThickRight ? 'border-r-2 border-r-[var(--grid-line-strong)]' : ''
                    } ${isThickBottom ? 'border-b-2 border-b-[var(--grid-line-strong)]' : ''} ${
                      previewVal === 0 ? 'bg-[var(--paper)]' : ''
                    } ${isCrosshair && !isSolved && previewVal === 0 ? 'bg-[var(--cell-hover)]' : ''} ${
                      isCursor ? 'ring-2 ring-inset ring-[var(--accent)]' : ''
                    } ${isWrong ? 'ring-2 ring-inset ring-red-500 bg-red-100 dark:bg-red-950/40 animate-pulse' : ''} ${
                      isHint ? 'ring-2 ring-inset ring-amber-400 bg-amber-100 dark:bg-amber-950/40' : ''
                    } ${isSolved && solution[r][c] === 1 ? 'cell-revealed' : ''}`}
                  >
                    {/* Flag / Cross symbol */}
                    {previewVal === 2 && (
                      <div className="w-full h-full flex items-center justify-center">
                        <svg className="w-3/5 h-3/5 text-[var(--accent)]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                          <line x1="5" y1="5" x2="19" y2="19" />
                          <line x1="19" y1="5" x2="5" y2="19" />
                        </svg>
                      </div>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
