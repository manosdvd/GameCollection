import { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';

const SoundContext = createContext(null);

export function SoundProvider({ children }) {
    const [enabled, setEnabled] = useState(() => {
        const saved = localStorage.getItem('sound_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    const [volume, setVolume] = useState(() => {
        const saved = localStorage.getItem('sound_volume');
        return saved !== null ? parseFloat(saved) : 0.5;
    });

    const audioCtxRef = useRef(null);

    useEffect(() => {
        localStorage.setItem('sound_enabled', JSON.stringify(enabled));
        localStorage.setItem('sound_volume', volume.toString());
    }, [enabled, volume]);

    const initAudioContext = useCallback(() => {
        if (!audioCtxRef.current) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                audioCtxRef.current = new AudioContext();
            }
        }
        if (audioCtxRef.current && audioCtxRef.current.state === 'suspended') {
            audioCtxRef.current.resume();
        }
        return audioCtxRef.current;
    }, []);

    const playTone = useCallback((freq, type = 'sine', duration = 0.1, relativeVolume = 1.0) => {
        if (!enabled) return;
        const ctx = initAudioContext();
        if (!ctx) return;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, ctx.currentTime);

        const masterVol = volume;
        const finalVol = relativeVolume * masterVol;

        gain.gain.setValueAtTime(0, ctx.currentTime);
        gain.gain.linearRampToValueAtTime(finalVol, ctx.currentTime + 0.01);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + duration);
    }, [enabled, volume, initAudioContext]);

    const playClick = useCallback(() => {
        playTone(800, 'sine', 0.1, 0.2);
        setTimeout(() => playTone(1200, 'triangle', 0.05, 0.1), 50);
    }, [playTone]);

    const playSuccess = useCallback(() => {
        [440, 554, 659, 880].forEach((f, i) => {
            setTimeout(() => playTone(f, 'sine', 0.8, 0.3), i * 100);
        });
    }, [playTone]);

    const playError = useCallback(() => {
        playTone(200, 'sawtooth', 0.3, 0.3);
    }, [playTone]);

    const value = {
        enabled,
        setEnabled,
        volume,
        setVolume,
        playTone,
        playClick,
        playSuccess,
        playError,
        initAudioContext
    };

    return (
        <SoundContext.Provider value={value}>
            {children}
        </SoundContext.Provider>
    );
}

export function useSound() {
    return useContext(SoundContext);
}
