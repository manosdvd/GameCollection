import { createContext, useContext, useState, useEffect, useCallback } from 'react';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
    const [hapticsEnabled, setHapticsEnabled] = useState(() => {
        const saved = localStorage.getItem('haptics_enabled');
        return saved !== null ? JSON.parse(saved) : true;
    });

    useEffect(() => {
        localStorage.setItem('haptics_enabled', JSON.stringify(hapticsEnabled));
    }, [hapticsEnabled]);

    const triggerHaptic = useCallback((pattern) => {
        if (!hapticsEnabled || !navigator.vibrate) return;
        try {
            navigator.vibrate(pattern);
        } catch (e) {
            // Ignore haptic errors
        }
    }, [hapticsEnabled]);

    const resetAllData = useCallback(() => {
        if (confirm("Are you sure you want to reset all game data? This cannot be undone.")) {
            localStorage.clear();
            window.location.reload();
        }
    }, []);

    const [colorBlindMode, setColorBlindMode] = useState(() => {
        const saved = localStorage.getItem('color_blind_mode');
        return saved !== null ? JSON.parse(saved) : false;
    });

    useEffect(() => {
        localStorage.setItem('color_blind_mode', JSON.stringify(colorBlindMode));
    }, [colorBlindMode]);

    const value = {
        hapticsEnabled,
        setHapticsEnabled,
        colorBlindMode,
        setColorBlindMode,
        triggerHaptic,
        resetAllData
    };

    return (
        <SettingsContext.Provider value={value}>
            {children}
        </SettingsContext.Provider>
    );
}

export function useSettings() {
    return useContext(SettingsContext);
}
