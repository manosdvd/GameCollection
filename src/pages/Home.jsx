import { Link } from 'react-router-dom';
import { Gamepad2, Grid, Hexagon, Lightbulb, SortAsc } from 'lucide-react';

const GAMES = [
    { id: 'cryptogram', name: 'Cryptogram', icon: SortAsc, color: 'text-emerald-400', path: '/cryptogram' },
    { id: 'hexenergy', name: 'HexEnergy', icon: Hexagon, color: 'text-cyan-400', path: '/hexenergy' },
    { id: 'anxiety', name: 'Anxiety', icon: Grid, color: 'text-amber-400', path: '/anxiety', disabled: false },
    { id: 'lightsout', name: 'Lights Out', icon: Lightbulb, color: 'text-yellow-200', path: '/lightsout', disabled: true },
    { id: 'jewelled', name: 'Jewelled', icon: Gamepad2, color: 'text-purple-400', path: '/jewelled', disabled: true },
];

export default function Home() {
    return (
        <div className="p-6 max-w-7xl mx-auto h-full flex flex-col items-center justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
                {GAMES.map((game) => (
                    <Link
                        key={game.id}
                        to={game.disabled ? '#' : game.path}
                        className={`
              relative group overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-8
              hover:bg-white/10 hover:border-primary/50 transition-all duration-300
              ${game.disabled ? 'opacity-50 cursor-not-allowed grayscale' : 'cursor-pointer'}
            `}
                    >
                        <div className="flex flex-col items-center gap-4 z-10 relative">
                            <game.icon className={`w-16 h-16 ${game.color} drop-shadow-[0_0_15px_rgba(0,0,0,0.5)]`} />
                            <h2 className="text-2xl font-bold tracking-widest uppercase">{game.name}</h2>
                            {game.disabled && <span className="text-xs text-white/40 font-mono">COMING SOON</span>}
                        </div>

                        {/* Hover Glow */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/0 via-primary/0 to-primary/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    </Link>
                ))}
            </div>
        </div>
    );
}
