import { useState, useEffect } from 'react';
import { useAnxietyEngine } from './useAnxietyEngine';
import { useSound } from '../../contexts/SoundContext';
import { useSettings } from '../../contexts/SettingsContext';
import { RefreshCw, Zap } from 'lucide-react';
import clsx from 'clsx';

// Colors map to Tailwind classes or CSS variables
const COLOR_MAP = {
    'red': { class: 'bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.5)]', icon: '❤️' },
    'blue': { class: 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.5)]', icon: '💧' },
    'green': { class: 'bg-green-500 shadow-[0_0_10px_rgba(34,197,94,0.5)]', icon: '🍀' },
    'yellow': { class: 'bg-yellow-400 shadow-[0_0_10px_rgba(250,204,21,0.5)]', icon: '⚡' },
    'purple': { class: 'bg-purple-500 shadow-[0_0_10px_rgba(168,85,247,0.5)]', icon: '⭐' }
};

export default function AnxietyGame() {
    const { grid, preview, score, level, gameOver, previewTick, swapTiles, reset } = useAnxietyEngine();
    const { playClick, playSuccess, playError } = useSound();
    const { triggerHaptic } = useSettings();

    const [selected, setSelected] = useState(null); // {x, y}

    const handleTileClick = (x, y) => {
        const tile = grid[y][x];
        if (!tile && !selected) return; // Can't select empty space as first

        if (!selected) {
            // Select first
            if (tile) {
                setSelected({ x, y });
                playClick();
            }
        } else {
            // Action
            if (selected.x === x && selected.y === y) {
                // Deselect
                setSelected(null);
            } else {
                // Swap
                swapTiles(selected.x, selected.y, x, y);
                setSelected(null);
                playClick(); // Sound for swap
                triggerHaptic(10);
            }
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">

            {/* HUD */}
            <div className="w-full max-w-md flex justify-between items-center mb-4 z-10">
                <div className="flex flex-col">
                    <span className="text-xs text-white/50 uppercase tracking-widest">Score</span>
                    <span className="text-2xl font-mono text-primary font-bold">{score.toLocaleString()}</span>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-xs text-white/50 uppercase tracking-widest">Level</span>
                    <span className="text-xl font-mono text-white font-bold">{level}</span>
                </div>
            </div>

            {/* Preview Bar */}
            <div className="w-full max-w-md h-12 bg-surface/50 rounded-lg border border-white/10 mb-2 flex p-1 gap-1 relative overflow-hidden">
                {/* Visualizing the "Tick" or Fill progress */}
                {Array(8).fill(null).map((_, i) => {
                    const item = preview[i];
                    return (
                        <div key={i} className="flex-1 h-full rounded transition-all duration-300 relative">
                            {item && (
                                <div className={clsx(
                                    "w-full h-full rounded animate-in zoom-in spin-in-3 duration-300 flex items-center justify-center text-sm",
                                    COLOR_MAP[item.color].class
                                )}>{COLOR_MAP[item.color].icon}</div>
                            )}
                        </div>
                    );
                })}
                {/* Danger Overlay if full */}
                {preview.length >= 8 && (
                    <div className="absolute inset-0 bg-red-500/20 animate-pulse pointer-events-none" />
                )}
            </div>

            {/* Main Grid */}
            <div
                className="w-full max-w-md aspect-square bg-surface/30 rounded-xl p-2 grid grid-cols-8 grid-rows-8 gap-1 relative"
                style={{ touchAction: 'none' }}
            >
                {grid.map((row, y) => (
                    row.map((tile, x) => (
                        <div
                            key={`${x}-${y}`}
                            onClick={() => handleTileClick(x, y)}
                            className={clsx(
                                "rounded-md transition-all duration-200 cursor-pointer hover:brightness-110",
                                tile ? COLOR_MAP[tile.color].class : "bg-white/5",
                                selected?.x === x && selected?.y === y && "ring-4 ring-white z-10 scale-105",
                                !tile && selected && "ring-2 ring-white/20 ring-inset" // Potential target hint
                            )}
                        >
                            <div className="flex items-center justify-center w-full h-full text-lg sm:text-2xl filter drop-shadow opacity-90">
                                {tile && COLOR_MAP[tile.color].icon}
                            </div>
                        </div>
                    ))
                ))}
            </div>

            {/* Game Over Screen */}
            {gameOver && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in">
                    <h2 className="text-4xl font-black text-white mb-2">ANXIETY MAXIMIZED</h2>
                    <p className="text-white/60 mb-8">Final Score: {score}</p>
                    <button
                        onClick={reset}
                        className="px-8 py-4 bg-primary text-black font-bold rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                    >
                        <RefreshCw /> Try Again
                    </button>
                </div>
            )}
        </div>
    );
}
