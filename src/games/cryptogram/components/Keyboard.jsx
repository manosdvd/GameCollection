
export default function Keyboard({ onGuess, onDelete, selectedEncryptedChar, solved, hintedChars, usedLetters, duplicateLetters }) {
    const rows = [
        "QWERTYUIOP",
        "ASDFGHJKL",
        "ZXCVBNM"
    ];

    return (
        <div className="select-none touch-manipulation max-w-2xl mx-auto px-2 pb-3 bg-transparent">
            {rows.map((row, i) => (
                <div key={i} className="flex justify-center gap-1 mb-2">
                    {row.split('').map(key => {
                        const isDuplicate = duplicateLetters?.has(key);
                        const isUsed = usedLetters?.has(key);

                        let btnClass = 'bg-white/10 text-white border border-white/20 shadow-sm hover:bg-white/20';

                        if (!selectedEncryptedChar || hintedChars.has(selectedEncryptedChar)) {
                            btnClass = 'bg-white/5 text-white/20 cursor-not-allowed border-transparent';
                        } else if (isDuplicate) {
                            btnClass = 'bg-amber-500/20 text-amber-300 border-2 border-amber-500 font-bold';
                        } else if (isUsed) {
                            btnClass = 'bg-white/5 text-white/40 border border-white/10';
                        }

                        return (
                            <button
                                key={key}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (onGuess) onGuess(key);
                                }}
                                disabled={!selectedEncryptedChar || solved || hintedChars.has(selectedEncryptedChar)}
                                className={`
                  flex-1 max-w-[40px] h-10 sm:h-12 rounded shadow-sm text-sm sm:text-lg font-semibold transition-colors
                  active:scale-90 active:bg-primary/20
                  ${btnClass}
                `}
                            >
                                {key}
                            </button>
                        );
                    })}
                </div>
            ))}
            <div className="flex justify-center mt-2">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        if (onDelete) onDelete();
                    }}
                    disabled={!selectedEncryptedChar || hintedChars.has(selectedEncryptedChar)}
                    className="px-8 py-2 bg-red-500/10 text-red-400 rounded-full text-sm font-medium hover:bg-red-500/20 disabled:opacity-50 border border-red-500/20 shadow-sm transition-colors"
                >
                    Backspace / Erase
                </button>
            </div>
        </div>
    );
}
