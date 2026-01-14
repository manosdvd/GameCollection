import { useState, useEffect, useRef } from 'react';
import { useAnxietyEngine, COLORS, SHAPES } from './useAnxietyEngine';
import { useSound } from '../../contexts/SoundContext';
import { useSettings } from '../../contexts/SettingsContext';
import { RefreshCw, Pause, Play, Zap, X, MoveHorizontal, MoveVertical, Circle, Disc } from 'lucide-react'; // Using Lucide as fallback shapes
import clsx from 'clsx';

// Icon Map (SVG Shapes)
const ShapeIcons = {
    'square': ({ className }) => <div className={clsx("w-full h-full border-4 border-current opacity-80 rounded-none", className)} />,
    'triangle': ({ className }) => <div className={clsx("w-0 h-0 border-l-[10px] border-r-[10px] border-b-[20px] border-l-transparent border-r-transparent border-b-current opacity-80 mx-auto", className)} />,
    'circle': ({ className }) => <div className={clsx("w-full h-full border-4 border-current opacity-80 rounded-full", className)} />,
    'star': ({ className }) => <Zap className={clsx("w-full h-full opacity-80", className)} fill="currentColor" />,
    'diamond': ({ className }) => <div className={clsx("w-8 h-8 border-4 border-current opacity-80 rotate-45 scale-75 mx-auto", className)} />,
    'cross': ({ className }) => <X className={clsx("w-full h-full opacity-80", className)} strokeWidth={4} />
};

const COLOR_STYLES = {
    'red': 'text-red-500 bg-red-900/30 border-red-500/50 shadow-[0_0_10px_rgba(239,68,68,0.3)]',
    'blue': 'text-blue-500 bg-blue-900/30 border-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.3)]',
    'green': 'text-green-500 bg-green-900/30 border-green-500/50 shadow-[0_0_10px_rgba(34,197,94,0.3)]',
    'yellow': 'text-yellow-400 bg-yellow-900/30 border-yellow-400/50 shadow-[0_0_10px_rgba(250,204,21,0.3)]',
    'purple': 'text-purple-500 bg-purple-900/30 border-purple-500/50 shadow-[0_0_10px_rgba(168,85,247,0.3)]',
    'cyan': 'text-cyan-400 bg-cyan-900/30 border-cyan-400/50 shadow-[0_0_10px_rgba(34,211,238,0.3)]'
};

const POWERUP_ICONS = {
    'radius': Circle,
    'col': MoveVertical,
    'row': MoveHorizontal,
    'x': X,
    'color': Disc
};

export default function AnxietyGame() {
    const {
        grid, preview, previewIndex, score, level, gameOver, paused,
        inventory, activeTool, events,
        swapTiles, useTool, selectTool, reset, togglePause, consumeEvents
    } = useAnxietyEngine();

    const { playClick, playSuccess, playError, playTone } = useSound();
    const { triggerHaptic } = useSettings();

    const [selected, setSelected] = useState(null);
    const [shake, setShake] = useState(false);
    const [particles, setParticles] = useState([]);
    const [floatingTexts, setFloatingTexts] = useState([]);
    const particleIdRef = useRef(0);

    // Consume Events
    useEffect(() => {
        if (events && events.length > 0) {
            events.forEach(ev => {
                if (ev.type === 'MATCH') {
                    spawnParticles(ev.x, ev.y, ev.color, 6);
                    playTone(600 + (Math.random() * 200), 'square', 0.05);
                } else if (ev.type === 'EXPLOSION') {
                    spawnParticles(ev.x, ev.y, ev.color, 12);
                    playTone(200, 'sawtooth', 0.1);
                    setShake(true);
                    setTimeout(() => setShake(false), 200);
                } else if (ev.type === 'FLOAT_TEXT') {
                    spawnText(ev.x, ev.y, ev.text, ev.color);
                } else if (ev.type === 'LEVEL_UP') {
                    playSuccess();
                    spawnText(3, 4, `LEVEL ${ev.level}!`, '#ffb700');
                }
            });
            consumeEvents();
        }
    }, [events]);

    // Cleanup Loop (Animation)
    useEffect(() => {
        const interval = setInterval(() => {
            setParticles(prev => prev.filter(p => p.life > 0).map(p => ({
                ...p,
                x: p.x + p.vx,
                y: p.y + p.vy,
                vy: p.vy + 2, // gravity
                life: p.life - 0.1
            })));
            setFloatingTexts(prev => prev.filter(t => t.life > 0).map(t => ({
                ...t,
                yPx: t.yPx - 2,
                life: t.life - 0.05
            })));
        }, 50);
        return () => clearInterval(interval);
    }, []);

    const spawnParticles = (gx, gy, colorName, count) => {
        const newP = [];
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const speed = 0.5 + Math.random();
            newP.push({
                id: particleIdRef.current++,
                x: (gx * 12.5) + 6.25, // % position (100/8 = 12.5)
                y: (gy * 10) + 5,      // % position (100/10 = 10)
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed - 2,
                color: colorName,
                life: 1.0
            });
        }
        setParticles(prev => [...prev, ...newP]);
    };

    const spawnText = (gx, gy, text, color) => {
        setFloatingTexts(prev => [...prev, {
            id: Date.now() + Math.random(),
            x: (gx * 12.5) + 6.25,
            y: (gy * 10) + 5,
            yPx: 0,
            text,
            color,
            life: 2.0
        }]);
    };

    // Shake effect (Legacy check)
    useEffect(() => {
        if (gameOver) {
            triggerHaptic(500);
            setShake(true);
            setTimeout(() => setShake(false), 500);
        }
    }, [gameOver]);

    const handleTileClick = (x, y) => {
        if (gameOver || paused) return;

        // Use Powerup?
        if (activeTool) {
            useTool(activeTool, y, x); // Engine expects row(y), col(x)
            triggerHaptic(50);
            setShake(true);
            setTimeout(() => setShake(false), 200);
            return;
        }

        const tile = grid[y][x];

        if (!selected) {
            if (tile) {
                setSelected({ x, y });
                playClick();
                triggerHaptic(5);
            }
        } else {
            // Unselect if same
            if (selected.x === x && selected.y === y) {
                setSelected(null);
                return;
            }

            // Swap (Teleport)
            swapTiles(selected.x, selected.y, x, y);
            setSelected(null);
            playTone(400, 'triangle', 0.1);
            triggerHaptic(10);
        }
    };

    return (
        <div className={clsx(
            "h-full flex flex-col items-center justify-center p-2 bg-neutral-950 relative overflow-hidden select-none",
            shake && "animate-shake" // Need to define keyframes in CSS or inline
        )}>
            {/* Shake Animation Style */}
            <style>{`
                @keyframes shake {
                    0%, 100% { transform: translateX(0); }
                    25% { transform: translateX(-5px) rotate(-1deg); }
                    75% { transform: translateX(5px) rotate(1deg); }
                }
                .animate-shake { animation: shake 0.2s cubic-bezier(.36,.07,.19,.97) both; }
            `}</style>

            {/* CRT Scanline */}
            <div className="absolute inset-0 pointer-events-none z-0 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_4px,3px_100%] opacity-20" />

            {/* Header HUD */}
            <div className="w-full max-w-md flex justify-between items-end mb-2 z-10 font-mono">
                <div className="flex flex-col">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Score</span>
                    <span className="text-2xl font-bold text-white leading-none">{score.toLocaleString()}</span>
                </div>

                <button
                    onClick={togglePause}
                    className="mb-1 p-2 rounded bg-white/5 border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
                >
                    {paused ? <Play size={20} fill="white" /> : <Pause size={20} fill="white" />}
                </button>

                <div className="flex flex-col items-end">
                    <span className="text-[10px] text-white/40 uppercase tracking-widest">Level</span>
                    <span className="text-xl font-bold text-amber-400 leading-none">{level}</span>
                </div>
            </div>

            {/* Preview Bar */}
            <div className="w-full max-w-md h-10 bg-black/50 rounded border border-white/10 mb-2 flex p-1 gap-1 relative overflow-hidden z-10 shadow-inner">
                {Array(8).fill(null).map((_, i) => {
                    const item = preview[i];
                    return (
                        <div key={i} className="flex-1 h-full rounded relative border border-white/5 bg-white/5 overflow-hidden">
                            {item && (
                                <div className={clsx(
                                    "w-full h-full animate-in zoom-in duration-200 flex items-center justify-center",
                                    COLOR_STYLES[item.color]
                                )}>
                                    {/* Small Preview Shape */}
                                    <div className="scale-50">
                                        {/* Shape matching logic? Currently engine doesn't store shape in preview... 
                                             We need consistent Color->Shape mapping. 
                                             Let's map Color Index to Shape Index.
                                         */}
                                        {/* We'll just define mapping: Red=Square, Blue=Triangle etc */}
                                        {(() => {
                                            const idx = COLORS.indexOf(item.color);
                                            const Shape = ShapeIcons[SHAPES[idx]];
                                            return <Shape className="w-full h-full" />;
                                        })()}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
                {/* Danger Overlay if full */}
                {previewIndex >= 7 && (
                    <div className="absolute inset-0 bg-red-500/10 animate-pulse pointer-events-none border-2 border-red-500/50 rounded" />
                )}
            </div>

            <div
                className="w-full max-w-md aspect-[4/5] bg-black/40 rounded-lg p-1 grid gap-1 relative z-10 border border-white/10"
                style={{
                    gridTemplateColumns: `repeat(8, 1fr)`,
                    gridTemplateRows: `repeat(10, 1fr)`
                }}
            >
                {/* PARTICLE LAYER */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden z-50">
                    {particles.map(p => (
                        <div
                            key={p.id}
                            className={clsx("absolute w-2 h-2 rounded-full", COLOR_STYLES[p.color].split(' ')[1])}
                            style={{
                                left: `${p.x}%`,
                                top: `${p.y}%`,
                                opacity: p.life,
                                transform: 'scale(' + p.life + ')'
                            }}
                        />
                    ))}
                    {floatingTexts.map(t => (
                        <div
                            key={t.id}
                            className="absolute font-black text-xl text-white drop-shadow-md z-50 whitespace-nowrap"
                            style={{
                                left: `${t.x}%`,
                                top: `${t.y}%`,
                                color: t.color,
                                transform: `translate(-50%, -50%) translateY(${t.yPx}px)`,
                                opacity: Math.min(1, t.life)
                            }}
                        >
                            {t.text}
                        </div>
                    ))}
                </div>
                {grid.map((row, y) => (
                    row.map((tile, x) => {
                        const isSelected = selected?.x === x && selected?.y === y;

                        return (
                            <div
                                key={`${x}-${y}`}
                                onClick={() => handleTileClick(x, y)}
                                className={clsx(
                                    "rounded relative transition-all duration-100 flex items-center justify-center cursor-pointer overflow-hidden",
                                    !tile && "bg-white/5 hover:bg-white/10",
                                    tile && COLOR_STYLES[tile.color],
                                    tile && "border hover:brightness-125 shadow-sm",
                                    isSelected && "ring-2 ring-white z-20 scale-105 brightness-150"
                                )}
                            >
                                {tile && (() => {
                                    const idx = COLORS.indexOf(tile.color);
                                    const Shape = ShapeIcons[SHAPES[idx]];
                                    return <div className="p-1.5 w-full h-full"><Shape /></div>;
                                })()}
                            </div>
                        );
                    })
                ))}
            </div>

            {/* Powerup Bar */}
            <div className="w-full max-w-md h-16 mt-2 grid grid-cols-5 gap-2 z-10">
                {Object.entries(inventory).map(([type, count]) => {
                    const Icon = POWERUP_ICONS[type];
                    return (
                        <button
                            key={type}
                            disabled={count <= 0 || paused}
                            onClick={() => selectTool(activeTool === type ? null : type)}
                            className={clsx(
                                "rounded flex flex-col items-center justify-center relative transition-all border",
                                activeTool === type
                                    ? "bg-amber-500 text-black border-amber-400 scale-105 shadow-[0_0_15px_rgba(245,158,11,0.5)]"
                                    : count > 0
                                        ? "bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700"
                                        : "bg-black/20 text-white/20 border-transparent"
                            )}
                        >
                            <Icon size={20} />
                            <span className="text-[9px] font-bold uppercase mt-1">{type}</span>
                            <div className={clsx(
                                "absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold border",
                                count > 0 ? "bg-red-500 text-white border-red-400" : "bg-white/10 border-transparent"
                            )}>
                                {count}
                            </div>
                        </button>
                    );
                })}
            </div>

            {/* Game Over Screen */}
            {gameOver && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-sm flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
                    <h2 className="text-5xl font-black text-red-500 mb-2 tracking-tighter drop-shadow-[0_0_10px_rgba(239,68,68,0.8)]">SYSTEM FAIL</h2>
                    <p className="text-white/60 mb-8 font-mono">Final Score: {score.toLocaleString()}</p>
                    <button
                        onClick={reset}
                        className="px-8 py-4 bg-amber-500 text-black font-bold rounded hover:scale-105 hover:bg-amber-400 transition-all flex items-center gap-2 shadow-[0_0_20px_rgba(245,158,11,0.5)]"
                    >
                        <RefreshCw /> REBOOT SYSTEM
                    </button>
                </div>
            )}

            {/* Pause Overlay */}
            {paused && !gameOver && (
                <div className="absolute inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-40">
                    <div className="bg-neutral-900 border border-white/10 p-8 rounded-lg text-center shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-4">PAUSED</h3>
                        <button onClick={togglePause} className="px-6 py-3 bg-white text-black font-bold rounded hover:bg-gray-200">
                            RESUME
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
