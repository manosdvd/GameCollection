import { useMemo } from 'react';
import { isLetter } from '../utils/cipher';

export default function QuoteDisplay({
    quote,
    cipher,
    userGuesses,
    cursorIndex,
    selectedEncryptedChar,
    checkMode,
    solved,
    hintedChars,
    onSelectChar
}) {

    const words = useMemo(() => {
        if (!quote) return [];
        const tokens = [];
        let currentIndex = 0;
        const rawWords = quote.split(' ');

        rawWords.forEach((wordText, i) => {
            tokens.push({
                text: wordText,
                startIndex: currentIndex,
                type: 'word'
            });
            currentIndex += wordText.length;
            if (i < rawWords.length - 1) {
                currentIndex += 1;
            }
        });
        return tokens;
    }, [quote]);

    const renderWord = (wordObj, index) => {
        const { text, startIndex } = wordObj;
        const isLast = index === words.length - 1;

        return (
            <div key={`${startIndex}-${text}`} className={`flex flex-nowrap max-w-full gap-0.5 sm:gap-1 ${isLast ? '' : 'mr-3 sm:mr-8'} mb-4 sm:mb-6`}>
                {text.split('').map((char, charOffset) => {
                    const currentIdx = startIndex + charOffset;

                    if (!isLetter(char)) {
                        return (
                            <div key={`punct-${currentIdx}`} className="flex flex-col justify-end w-3 sm:w-6 h-14 sm:h-20 pb-2 items-center shrink min-w-0">
                                <span className="text-lg sm:text-3xl text-white font-bold">{char}</span>
                            </div>
                        );
                    }

                    const encryptedChar = cipher[char];
                    const isCursor = cursorIndex === currentIdx;
                    const isSelectedGroup = selectedEncryptedChar === encryptedChar;
                    const userGuess = userGuesses[encryptedChar] || '';
                    const isHinted = hintedChars.has(encryptedChar);

                    // Validation styles
                    const isWrong = checkMode && userGuess !== char;
                    const isCorrect = solved || (checkMode && userGuess === char) || isHinted;

                    return (
                        <div
                            key={`char-${currentIdx}`}
                            id={`char-${currentIdx}`}
                            onClick={(e) => {
                                e.stopPropagation();
                                onSelectChar(currentIdx);
                            }}
                            className={`
                                flex flex-col items-center cursor-pointer transition-all duration-150 group
                                w-7 xs:w-8 sm:w-12 relative shrink min-w-0
                            `}
                        >
                            <div className={`
                                text-[10px] sm:text-sm font-semibold mb-0.5 sm:mb-1 select-none transition-colors
                                ${isSelectedGroup ? 'text-primary font-bold scale-110' : 'text-white/40'}
                                ${isHinted ? 'text-green-400' : ''}
                            `}>
                                {encryptedChar}
                            </div>

                            <div className={`
                                w-full aspect-square border-2 rounded sm:rounded-lg flex items-center justify-center
                                text-lg sm:text-2xl font-bold uppercase select-none transition-all
                                ${isCursor ? 'border-primary bg-primary/20 shadow-[0_0_15px_rgba(0,255,170,0.4)] transform -translate-y-1' : ''}
                                ${isSelectedGroup && !isCursor ? 'bg-primary/10 border-primary/50' : ''}
                                ${!isSelectedGroup && !isCursor ? 'border-white/20 hover:border-white/40 bg-white/5' : ''}
                                
                                /* Hint / Correct Styles */
                                ${isHinted ? 'bg-green-500/20 border-green-500/50 text-green-300' : ''}
                                ${solved ? 'text-primary border-primary' : 'text-white'}
                                
                                /* Check Mode Styles */
                                ${isWrong ? 'bg-red-500/20 border-red-500/50 text-red-300' : ''}
                                ${checkMode && isCorrect && !solved ? 'text-green-300 border-green-500/50' : ''}
                            `}>
                                {userGuess}
                            </div>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <div className="flex flex-wrap justify-center content-center">
            {words.map((wordObj, i) => renderWord(wordObj, i))}
        </div>
    );
}
