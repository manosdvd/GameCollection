
import { RefreshCw, Info } from 'lucide-react';
import Timer from './Timer';

export default function Header({ loading, onNewGame, solved, time, onTimeUpdate }) {
    return (
        <header className="flex-none flex justify-between items-center px-4 py-3 border-b border-slate-200 bg-white z-10 shadow-sm">
            <div className="flex items-center gap-3">
                <div className="hidden sm:block p-1.5 bg-blue-600 rounded-lg text-white">
                    <Info size={20} />
                </div>
                <div>
                    <h1 className="text-xl font-bold text-slate-800 leading-none">Cryptogram</h1>
                    <p className="hidden sm:block text-slate-500 text-xs mt-1">Decipher the quote</p>
                </div>
            </div>

            <Timer
                solved={solved}
                loading={loading}
                initialSeconds={time}
                onTimeUpdate={onTimeUpdate}
            />

            <button
                onClick={(e) => { e.stopPropagation(); onNewGame(); }}
                className="p-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
                title="New Game"
            >
                <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
            </button>
        </header>
    );
}
