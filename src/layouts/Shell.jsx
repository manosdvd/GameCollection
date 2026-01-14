import { Outlet, useLocation } from 'react-router-dom';
import { Settings, Menu as MenuIcon, Volume2, VolumeX } from 'lucide-react';
import Clock from '../components/Clock';
import { useSound } from '../contexts/SoundContext';

export default function Shell() {
    const location = useLocation();
    const isHome = location.pathname === '/';
    const { enabled, setEnabled } = useSound();

    return (
        <div className="min-h-screen bg-background text-white flex flex-col font-sans">
            {/* Header */}
            <header className="h-16 border-b border-white/10 flex items-center justify-between px-6 bg-surface backdrop-blur-md sticky top-0 z-50">
                <div className="flex items-center gap-4">
                    {!isHome && (
                        <a href="/" className="p-2 hover:bg-white/10 rounded-full transition-colors">
                            <MenuIcon className="w-6 h-6 text-primary" />
                        </a>
                    )}
                    <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-400 bg-clip-text text-transparent">
                        GAME COLLECTION
                    </h1>
                </div>

                <div className="flex items-center gap-6">
                    <Clock />
                    <button
                        onClick={() => setEnabled(!enabled)}
                        className="p-2 hover:bg-white/10 rounded-full transition-colors"
                        title={enabled ? "Mute Sound" : "Enable Sound"}
                    >
                        {enabled ? (
                            <Volume2 className="w-6 h-6 text-primary hover:text-white transition-colors" />
                        ) : (
                            <VolumeX className="w-6 h-6 text-secondary hover:text-red-400 transition-colors" />
                        )}
                    </button>
                    <button className="p-2 hover:bg-white/10 rounded-full transition-colors">
                        <Settings className="w-6 h-6 text-secondary hover:text-white transition-colors" />
                    </button>
                </div>
            </header>

            {/* Main Content Area */}
            <main className="flex-1 relative overflow-hidden">
                <Outlet />
            </main>
        </div>
    );
}
