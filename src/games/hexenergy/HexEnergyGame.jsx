import { useRef, useLayoutEffect, useState } from 'react';
import { HexEnergyEngine } from './engine';
import './hexenergy.css';
import { RefreshCw, RotateCcw, ChevronRight } from 'lucide-react';
import { useSound } from '../../contexts/SoundContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function HexEnergyGame() {
    const containerRef = useRef(null);
    const engineRef = useRef(null);

    const [level, setLevel] = useState(1);
    const [stats, setStats] = useState({ moves: 0, time: 0 });
    const [progress, setProgress] = useState(0);
    const [victory, setVictory] = useState(false);

    // Audio Context
    const { playClick, playSuccess, playTone } = useSound();
    const { triggerHaptic } = useSettings();

    useLayoutEffect(() => {
        if (!containerRef.current) return;

        // Init Engine
        engineRef.current = new HexEnergyEngine(containerRef.current, {
            onStats: (m, t) => setStats({ moves: m, time: t }),
            onProgress: (p) => setProgress(p),
            onVictory: () => setVictory(true)
        }, {
            playClick,
            playVictory: playSuccess,
            playTone,
            triggerHaptic
        });

        // Start Level 1
        engineRef.current.loadLevel(1);

        return () => {
            if (engineRef.current) engineRef.current.destroy();
        };
    }, []);

    const formatTime = (secs) => {
        const m = Math.floor(secs / 60);
        const s = secs % 60;
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleNextLevel = () => {
        const next = level + 1;
        setLevel(next);
        setVictory(false);
        setProgress(0);
        engineRef.current.loadLevel(next);
    };

    const handleReset = () => {
        if (engineRef.current) engineRef.current.reset();
    };

    return (
        <div className="w-full h-full relative bg-background overflow-hidden flex flex-col">
            {/* HUD */}
            <div className="absolute top-0 w-full p-4 flex justify-between items-start pointer-events-none z-10">
                <div className="bg-surface/80 backdrop-blur border border-white/10 rounded-full px-6 py-2 flex items-center gap-4 text-white shadow-lg pointer-events-auto">
                    <span className="font-bold text-primary tracking-widest text-sm">LEVEL {level}</span>
                    <div className="w-px h-4 bg-white/20"></div>
                    <span className={`tabular-nums font-mono ${progress === 100 ? 'text-primary' : 'text-white/70'}`}>
                        {progress}% SYNCED
                    </span>
                </div>

                <div className="flex gap-2 pointer-events-auto">
                    <div className="bg-surface/80 backdrop-blur border border-white/10 rounded-full px-4 py-2 flex flex-col items-center min-w-[80px]">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Moves</span>
                        <span className="text-xl font-bold font-mono text-white/90">{stats.moves}</span>
                    </div>
                    <div className="bg-surface/80 backdrop-blur border border-white/10 rounded-full px-4 py-2 flex flex-col items-center min-w-[80px]">
                        <span className="text-[10px] text-white/40 uppercase font-bold tracking-wider">Time</span>
                        <span className="text-xl font-bold font-mono text-white/90">{formatTime(stats.time)}</span>
                    </div>
                </div>
            </div>

            {/* Game Canvas Container */}
            <div ref={containerRef} className="flex-1 w-full h-full relative touch-none flex items-center justify-center">
                {/* Engine places #hex-grid here */}
            </div>

            {/* Bottom Controls Removed per User Request */}
            {/* {!victory && ( ...buttons... )} */}

            {/* Victory Screen */}
            <div className={`
                absolute inset-0 bg-black/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center
                transition-all duration-500
                ${victory ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}
            `}>
                <h1 className="text-5xl md:text-7xl font-black text-transparent bg-clip-text bg-gradient-to-b from-white to-white/50 tracking-tighter mb-2 drop-shadow-[0_0_30px_rgba(0,255,170,0.5)]">
                    STABILIZED
                </h1>
                <p className="text-primary font-mono tracking-widest mb-12">SECTOR {level} CLEARED</p>

                <button
                    onClick={handleNextLevel}
                    className="group relative px-8 py-4 bg-primary text-black font-bold text-xl rounded-full hover:scale-105 transition-transform flex items-center gap-2"
                >
                    <span>NEXT SECTOR</span>
                    <ChevronRight className="group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 rounded-full ring-4 ring-primary/30 animate-pulse"></div>
                </button>
            </div>
        </div>
    );
}
