import { useState, useEffect, useCallback, useMemo } from 'react';
import { Trophy, Star, Zap, RefreshCw } from 'lucide-react';
import QuoteDisplay from './components/QuoteDisplay';
import Keyboard from './components/Keyboard';
import GameControls from './components/GameControls';
import { fetchNewGameData } from './utils/api';
import { isLetter } from './utils/cipher';
import { saveGameState, loadGameState, clearGameState, saveHighScore, loadHighScore } from './utils/storage';
import { calculateScore } from './utils/score';
import Timer from './components/Timer';
import { useSound } from '../../contexts/SoundContext';
import { useSettings } from '../../contexts/SettingsContext';

export default function CryptogramGame() {
    const { playClick, playSuccess, playError } = useSound();
    const { triggerHaptic } = useSettings();
    const [loading, setLoading] = useState(true);
    const [originalQuote, setOriginalQuote] = useState(null);
    const [author, setAuthor] = useState("");
    const [source, setSource] = useState("");
    const [cipher, setCipher] = useState({});
    const [reverseCipher, setReverseCipher] = useState({});
    const [userGuesses, setUserGuesses] = useState({});
    const [cursorIndex, setCursorIndex] = useState(null);
    const [solved, setSolved] = useState(false);
    const [checkMode, setCheckMode] = useState(false);
    const [hintedChars, setHintedChars] = useState(new Set());
    const [showConfetti, setShowConfetti] = useState(false);
    const [elapsedTime, setElapsedTime] = useState(0);
    const [highScore, setHighScore] = useState(0);
    const [scoreData, setScoreData] = useState(null);
    const [isNewHighScore, setIsNewHighScore] = useState(false);

    // Derived state
    const selectedEncryptedChar = useMemo(() => {
        if (cursorIndex === null || !originalQuote || !cipher) return null;
        const plainChar = originalQuote[cursorIndex];
        return cipher[plainChar];
    }, [cursorIndex, originalQuote, cipher]);

    const duplicateLetters = useMemo(() => {
        const counts = {};
        const duplicates = new Set();
        Object.values(userGuesses).forEach(char => {
            counts[char] = (counts[char] || 0) + 1;
        });
        Object.entries(counts).forEach(([char, count]) => {
            if (count > 1) duplicates.add(char);
        });
        return duplicates;
    }, [userGuesses]);

    const startNewGame = useCallback(async (isRetry = false) => {
        setLoading(true);
        setSolved(false);
        setUserGuesses({});
        setCursorIndex(null);
        setCheckMode(false);
        setHintedChars(new Set());
        setShowConfetti(false);
        setElapsedTime(0);
        setScoreData(null);
        setIsNewHighScore(false);
        clearGameState();

        const data = await fetchNewGameData();
        setOriginalQuote(data.quote);
        setAuthor(data.author);
        setSource(data.source);
        setCipher(data.cipher);
        setReverseCipher(data.reverseCipher);
        setLoading(false);
    }, []);

    useEffect(() => {
        setHighScore(loadHighScore()); // Load high score once
        const saved = loadGameState();
        if (saved && saved.originalQuote) {
            setOriginalQuote(saved.originalQuote);
            setAuthor(saved.author);
            setSource(saved.source);
            setCipher(saved.cipher);
            setReverseCipher(saved.reverseCipher);
            setUserGuesses(saved.userGuesses);
            setHintedChars(saved.hintedChars);
            setSolved(saved.solved);
            setElapsedTime(saved.elapsedTime || 0);

            if (saved.solved && saved.scoreData) {
                setScoreData(saved.scoreData);
            }
            setLoading(false);
        } else {
            startNewGame();
        }
    }, [startNewGame]);

    useEffect(() => {
        if (!loading && originalQuote) {
            saveGameState({
                originalQuote, author, source, cipher, reverseCipher, userGuesses, hintedChars, solved, elapsedTime, scoreData
            });
        }
    }, [loading, originalQuote, author, source, cipher, reverseCipher, userGuesses, hintedChars, solved, elapsedTime, scoreData]);

    const getLetterIndices = useCallback(() => {
        if (!originalQuote) return [];
        return originalQuote.split('').map((c, i) => isLetter(c) ? i : -1).filter(i => i !== -1);
    }, [originalQuote]);

    useEffect(() => {
        if (!loading && !solved && cursorIndex === null && originalQuote) {
            const indices = getLetterIndices();
            if (indices.length > 0) {
                let firstUnfilled = indices.find(idx => {
                    const char = originalQuote[idx];
                    const enc = cipher[char];
                    return !userGuesses[enc];
                });
                if (firstUnfilled === undefined) firstUnfilled = indices[0];
                setCursorIndex(firstUnfilled);
            }
        }
    }, [loading, solved, originalQuote, getLetterIndices, cipher, userGuesses]);

    const moveCursor = useCallback((direction) => {
        if (cursorIndex === null) {
            const indices = getLetterIndices();
            if (indices.length > 0) setCursorIndex(indices[0]);
            return;
        }
        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        let newPos = currentPos + direction;
        if (newPos < 0) newPos = 0;
        if (newPos >= indices.length) newPos = indices.length - 1;
        setCursorIndex(indices[newPos]);
    }, [cursorIndex, getLetterIndices]);

    const handleGuess = useCallback((guessChar) => {
        if (solved || !selectedEncryptedChar) return;
        if (hintedChars.has(selectedEncryptedChar)) return;

        setUserGuesses(prev => {
            const newGuesses = { ...prev };
            triggerHaptic(5);
            if (guessChar === null) {
                delete newGuesses[selectedEncryptedChar];
            } else {
                newGuesses[selectedEncryptedChar] = guessChar;
            }
            const isComplete = originalQuote.split('').every(char => {
                if (!isLetter(char)) return true;
                const encrypted = cipher[char];
                return newGuesses[encrypted] === char;
            });
            if (isComplete) {
                setSolved(true);
                setShowConfetti(true);
                playSuccess();
                setCursorIndex(null);
                setCheckMode(false);
                clearGameState();
            }
            return newGuesses;
        });
    }, [solved, selectedEncryptedChar, hintedChars, originalQuote, cipher]);

    useEffect(() => {
        if (solved && !scoreData && originalQuote) {
            const result = calculateScore(originalQuote, elapsedTime, hintedChars.size);
            setScoreData(result);
            const isNew = saveHighScore(result.finalScore);
            if (isNew) {
                setIsNewHighScore(true);
                setHighScore(result.finalScore);
            }
        }
    }, [solved, scoreData, originalQuote, elapsedTime, hintedChars.size]);

    const moveCursorToNextUnfilled = useCallback(() => {
        if (!originalQuote || cursorIndex === null) return;
        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;

        let nextIndex = -1;
        for (let i = currentPos + 1; i < indices.length; i++) {
            const rawIndex = indices[i];
            const plainChar = originalQuote[rawIndex];
            const enc = cipher[plainChar];
            if (!userGuesses[enc]) {
                nextIndex = rawIndex;
                break;
            }
        }
        if (nextIndex !== -1) {
            setCursorIndex(nextIndex);
        } else {
            moveCursor(1);
        }
    }, [cursorIndex, originalQuote, cipher, userGuesses, getLetterIndices, moveCursor]);

    const moveCursorLeft = useCallback(() => {
        if (!originalQuote || cursorIndex === null) return;
        const indices = getLetterIndices();
        const currentPos = indices.indexOf(cursorIndex);
        if (currentPos === -1) return;
        let nextPos = currentPos - 1;
        while (nextPos >= 0) {
            const rawIndex = indices[nextPos];
            const plainChar = originalQuote[rawIndex];
            const enc = cipher[plainChar];
            if (hintedChars.has(enc)) {
                nextPos--;
                continue;
            }
            setCursorIndex(rawIndex);
            return;
        }
    }, [cursorIndex, originalQuote, cipher, hintedChars, getLetterIndices]);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (solved || loading) return;
            const key = e.key.toUpperCase();
            if (e.key === 'ArrowRight') { moveCursor(1); return; }
            if (e.key === 'ArrowLeft') { moveCursor(-1); return; }
            if (isLetter(key)) {
                if (cursorIndex !== null && selectedEncryptedChar) {
                    playClick();
                    handleGuess(key);
                    moveCursorToNextUnfilled();
                }
            } else if (e.key === 'Backspace' || e.key === 'Delete') {
                if (cursorIndex !== null && selectedEncryptedChar) {
                    playClick();
                    handleGuess(null);
                    if (e.key === 'Backspace') moveCursorLeft();
                }
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [cursorIndex, selectedEncryptedChar, solved, loading, moveCursor, handleGuess, moveCursorToNextUnfilled, moveCursorLeft]);

    const giveHint = () => {
        playClick();
        if (solved || !originalQuote) return;
        if (selectedEncryptedChar && !hintedChars.has(selectedEncryptedChar)) {
            const correctPlain = reverseCipher[selectedEncryptedChar];
            setHintedChars(prev => new Set(prev).add(selectedEncryptedChar));
            setUserGuesses(prev => {
                const newGuesses = { ...prev };
                newGuesses[selectedEncryptedChar] = correctPlain;
                const isComplete = originalQuote.split('').every(char => {
                    if (!isLetter(char)) return true;
                    const encrypted = cipher[char];
                    return newGuesses[encrypted] === char;
                });
                if (isComplete) {
                    setSolved(true);
                    setShowConfetti(true);
                    setCursorIndex(null);
                    setCheckMode(false);
                }
                return newGuesses;
            });
            return;
        }

        const availableHints = [];
        const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
        alphabet.forEach(plainChar => {
            if (!originalQuote.includes(plainChar)) return;
            const encrypted = cipher[plainChar];
            if (hintedChars.has(encrypted)) return;
            if (userGuesses[encrypted] !== plainChar) {
                availableHints.push(encrypted);
            }
        });

        if (availableHints.length > 0) {
            const randomEncrypted = availableHints[Math.floor(Math.random() * availableHints.length)];
            const correctPlain = reverseCipher[randomEncrypted];
            setHintedChars(prev => new Set(prev).add(randomEncrypted));
            setUserGuesses(prev => {
                const newGuesses = { ...prev };
                newGuesses[randomEncrypted] = correctPlain;
                const isComplete = originalQuote.split('').every(char => {
                    if (!isLetter(char)) return true;
                    const encrypted = cipher[char];
                    return newGuesses[encrypted] === char;
                });
                if (isComplete) {
                    setSolved(true);
                    setShowConfetti(true);
                    setCursorIndex(null);
                    setCheckMode(false);
                }
                return newGuesses;
            });
            const firstIndex = originalQuote.indexOf(reverseCipher[randomEncrypted]);
            if (firstIndex !== -1) setCursorIndex(firstIndex);
        }
    };

    const toggleCheckWork = () => setCheckMode(!checkMode);
    const clearMistakes = () => {
        if (solved) return;
        setUserGuesses(prev => {
            const newGuesses = { ...prev };
            Object.keys(newGuesses).forEach(enc => {
                if (hintedChars.has(enc)) return;
                delete newGuesses[enc];
            });
            return newGuesses;
        });
        setCheckMode(false);
    };

    return (
        <div className="h-full flex flex-col overflow-hidden text-white bg-transparent" onClick={() => setCursorIndex(null)}>

            {/* Sub-Header for Game Controls */}
            <div className="flex-none flex justify-between items-center px-4 py-3 border-b border-white/10 bg-surface/50 backdrop-blur-sm z-10 w-full animate-in fade-in slide-in-from-top-4">
                <div className="flex items-center gap-3">
                    <span className="text-sm font-mono text-white/50">
                        BEST: <span className="text-primary">{highScore.toLocaleString()}</span>
                    </span>
                </div>

                <Timer
                    solved={solved}
                    loading={loading}
                    initialSeconds={elapsedTime}
                    onTimeUpdate={setElapsedTime}
                />

                <button
                    onClick={(e) => { e.stopPropagation(); startNewGame(); }}
                    className="p-2 rounded-full hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                    title="New Game"
                >
                    <RefreshCw size={20} className={loading ? "animate-spin" : ""} />
                </button>
            </div>

            <main className="flex-grow overflow-y-auto w-full relative scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                <div className="max-w-4xl mx-auto px-4 py-8 pb-96">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center h-64 text-white/30 animate-pulse">
                            <p>Loading Quote...</p>
                        </div>
                    ) : (
                        <>
                            <div className="w-full bg-white/5 p-4 sm:p-8 rounded-xl ring-1 ring-white/10 shadow-xl min-h-[150px] flex flex-col justify-center mb-6 backdrop-blur-sm">
                                <QuoteDisplay
                                    quote={originalQuote}
                                    cipher={cipher}
                                    userGuesses={userGuesses}
                                    cursorIndex={cursorIndex}
                                    selectedEncryptedChar={selectedEncryptedChar}
                                    checkMode={checkMode}
                                    solved={solved}
                                    hintedChars={hintedChars}
                                    onSelectChar={setCursorIndex}
                                />

                                <div className={`mt-8 text-center transition-all duration-700 overflow-hidden ${solved ? 'opacity-100 max-h-96 translate-y-0' : 'opacity-0 max-h-0 translate-y-4'}`}>
                                    <div className="flex flex-col items-center gap-4">
                                        <div className="inline-flex items-center gap-2 text-primary font-medium px-4 py-2 bg-primary/10 rounded-full border border-primary/20">
                                            <Trophy size={18} />
                                            <span>Correct! &mdash; <span className="font-bold text-white">{author}</span></span>
                                        </div>

                                        {scoreData && (
                                            <div className="bg-surface border border-white/10 rounded-xl p-4 w-full max-w-sm">
                                                <div className="flex items-center justify-center gap-2 text-2xl font-black text-white mb-1">
                                                    {isNewHighScore && <Star className="text-amber-500 fill-amber-500 animate-spin-slow" />}
                                                    <span>{scoreData.finalScore.toLocaleString()}</span>
                                                </div>
                                                <div className="text-xs text-secondary font-medium uppercase tracking-wide mb-3">
                                                    {isNewHighScore ? "New High Score!" : "Final Score"}
                                                </div>

                                                <div className="grid grid-cols-2 gap-2 text-xs text-white/60">
                                                    <div className="flex justify-between">
                                                        <span>Accuracy:</span>
                                                        <span className="font-mono text-white">{scoreData.baseScore}</span>
                                                    </div>
                                                    <div className="flex justify-between text-red-400">
                                                        <span>Hints:</span>
                                                        <span className="font-mono">-{scoreData.penalty}</span>
                                                    </div>
                                                </div>
                                                <div className="mt-2 pt-2 border-t border-white/10 flex justify-between items-center text-xs font-bold text-cyan-400">
                                                    <span className="flex items-center gap-1"><Zap size={12} /> Speed Bonus</span>
                                                    <span>x{scoreData.multiplier.toFixed(1)} ({scoreData.rank})</span>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {solved && (
                                <div className="flex justify-center animate-bounce mt-8">
                                    <button
                                        onClick={(e) => { e.stopPropagation(); startNewGame(); }}
                                        className="px-8 py-3 bg-primary text-black rounded-xl font-bold shadow-[0_0_20px_rgba(0,255,170,0.3)] hover:shadow-[0_0_40px_rgba(0,255,170,0.5)] transition-all"
                                    >
                                        Next Quote
                                    </button>
                                </div>
                            )}

                            <footer className="mt-8 text-center text-white/20 text-xs">
                                Cryptogram Challenge • Data provided by {source || 'Unknown'}
                            </footer>
                        </>
                    )}
                </div>
            </main>

            {!solved && !loading && (
                <div className="fixed bottom-0 left-0 right-0 bg-neutral-900 border-t border-white/10 z-50 w-full shadow-[0_-5px_20px_rgba(0,0,0,0.5)]" onClick={(e) => e.stopPropagation()}>
                    <GameControls
                        onHint={giveHint}
                        onCheck={toggleCheckWork}
                        onClear={clearMistakes}
                        checkMode={checkMode}
                        selectedEncryptedChar={selectedEncryptedChar}
                        hintedChars={hintedChars}
                    />
                    <Keyboard
                        onGuess={(char) => { playClick(); handleGuess(char); moveCursorToNextUnfilled(); }}
                        onDelete={() => { playClick(); handleGuess(null); moveCursorLeft(); }}
                        selectedEncryptedChar={selectedEncryptedChar}
                        solved={solved}
                        hintedChars={hintedChars}
                        usedLetters={new Set(Object.values(userGuesses))}
                        duplicateLetters={duplicateLetters}
                    />
                </div>
            )}

            {solved && showConfetti && (
                <div className="fixed inset-0 pointer-events-none overflow-hidden z-50">
                    {[...Array(20)].map((_, i) => (
                        <div key={i} className="absolute animate-fall" style={{
                            left: `${Math.random() * 100}%`, top: `-5%`,
                            animationDuration: `${Math.random() * 3 + 2}s`,
                            animationDelay: `${Math.random() * 2}s`,
                            fontSize: `${Math.random() * 20 + 10}px`
                        }}>
                            {['🎉', '✨', '👏', '⭐'][Math.floor(Math.random() * 4)]}
                        </div>
                    ))}
                </div>
            )}
            <style>{`
                @keyframes fall {
                    0% { transform: translateY(0) rotate(0deg); opacity: 1; }
                    100% { transform: translateY(100vh) rotate(360deg); opacity: 0; }
                }
                .animate-fall {
                    animation-name: fall;
                    animation-timing-function: linear;
                    animation-iteration-count: 1;
                }
            `}</style>
        </div>
    );
}
