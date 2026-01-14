import { useState, useEffect } from 'react';
import { Lightbulb, RotateCcw, Wand2, Zap } from 'lucide-react';
import { createProblem, toggle, isSolved, solve, ROWS, COLS } from './lightsOutLogic';
import { useSound } from '../../contexts/SoundContext';

export default function LightsOutGame() {
    const { playClick, playSuccess, playTone } = useSound();

    // Grid: flat array of booleans
    const [grid, setGrid] = useState(() => createProblem(5)); // Start with simple 5 moves
    const [moves, setMoves] = useState(0);
    const [solved, setSolved] = useState(false);
    const [hint, setHint] = useState(null); // {x, y} next move hint

    useEffect(() => {
        if (isSolved(grid)) {
            if (!solved && moves > 0) {
                setSolved(true);
                playSuccess();
            }
        } else {
            setSolved(false);
        }
    }, [grid]);

    const handleToggle = (x, y) => {
        if (solved) return;
        playClick();
        setGrid(prev => toggle(prev, x, y));
        setMoves(m => m + 1);
        setHint(null);
    };

    const handleNewGame = () => {
        playTone(600, 'sine', 0.1);
        setGrid(createProblem(15));
        setMoves(0);
        setSolved(false);
        setHint(null);
    };

    const handleReset = () => {
        // Resetting to exact same start state is tricky unless we save seed.
        // For now, simple logic: Just new game.
        handleNewGame();
    };

    const handleSolveHit = () => {
        // Auto solver
        const solution = solve(grid);
        if (solution.length > 0) {
            // Visualize one step
            const next = solution[0];
            setHint(next);
            playTone(800, 'sine', 0.1);
        }
    };

    return (
        <div className="h-full flex flex-col items-center justify-center p-4 bg-background relative overflow-hidden">

            {/* Header / Stats */}
            <div className="flex gap-8 mb-8 text-white/80 font-mono text-lg">
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase opacity-50">Moves</span>
                    <span className="font-bold text-2xl">{moves}</span>
                </div>
                <div className="flex flex-col items-center">
                    <span className="text-xs uppercase opacity-50">Target</span>
                    <span className="font-bold text-2xl text-yellow-400">DARK</span>
                </div>
            </div>

            {/* Grid */}
            <div
                className="grid gap-2 p-4 bg-surface/30 rounded-xl shadow-2xl relative"
                style={{
                    gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))`,
                    width: 'min(90vw, 400px)',
                    aspectRatio: '1'
                }}
            >
                {grid.map((isOn, i) => {
                    const x = i % COLS;
                    const y = Math.floor(i / COLS);
                    const isHint = hint && hint.x === x && hint.y === y;

                    return (
                        <button
                            key={i}
                            onClick={() => handleToggle(x, y)}
                            className={`
                                relative rounded-md transition-all duration-200
                                flex items-center justify-center
                                ${isOn
                                    ? 'bg-yellow-400/90 shadow-[0_0_20px_rgba(250,204,21,0.6)] text-black scale-100 hover:scale-105 z-10'
                                    : 'bg-white/5 border border-white/10 text-white/10 hover:bg-white/10 scale-95'
                                }
                                ${isHint ? 'ring-4 ring-pink-500 ring-offset-2 ring-offset-black animate-pulse' : ''}
                            `}
                        >
                            <Lightbulb size={isOn ? 32 : 24} strokeWidth={isOn ? 2.5 : 1.5} />
                        </button>
                    );
                })}
            </div>

            {/* Controls */}
            <div className="flex gap-4 mt-10">
                <button
                    onClick={handleNewGame}
                    className="p-4 rounded-full bg-surface border border-white/10 text-white hover:bg-white/10 active:scale-95 transition-all"
                    title="New Game"
                >
                    <RotateCcw />
                </button>
                <button
                    onClick={handleSolveHit}
                    className="px-6 py-4 rounded-full bg-indigo-600 text-white font-bold hover:bg-indigo-500 shadow-lg hover:shadow-indigo-500/25 active:scale-95 transition-all flex items-center gap-2"
                    title="Hint / Solve"
                >
                    <Wand2 size={18} /> Auto-Solve
                </button>
            </div>

            {/* Victory Overlay */}
            {solved && (
                <div className="absolute inset-0 bg-black/80 backdrop-blur-md flex flex-col items-center justify-center z-50 animate-in fade-in zoom-in duration-300">
                    <h2 className="text-5xl font-black text-white mb-2 tracking-tighter">LIGHTS OUT</h2>
                    <p className="text-white/60 mb-8 font-mono">Moves: {moves}</p>
                    <button
                        onClick={handleNewGame}
                        className="px-8 py-4 bg-yellow-400 text-black font-bold rounded-full text-xl hover:scale-110 shadow-[0_0_30px_rgba(250,204,21,0.5)] transition-all flex items-center gap-2"
                    >
                        <Zap fill="black" /> Play Again
                    </button>
                </div>
            )}
        </div>
    );
}
