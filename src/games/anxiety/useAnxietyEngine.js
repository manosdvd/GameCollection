import { useReducer, useEffect, useCallback, useRef } from 'react';
import { randomColor, findMatches, applyGravity, createEmptyGrid, COLS, ROWS } from './anxietyUtils';

// --- Constants ---
export const COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];
export const SHAPES = ['square', 'triangle', 'circle', 'star', 'diamond', 'cross'];

const INITIAL_STATE = {
    grid: createEmptyGrid(), // 10x8
    preview: Array(8).fill(null),
    previewIndex: 0,
    score: 0,
    level: 1,
    levelScore: 0,
    gameOver: false,
    paused: false,
    inventory: { radius: 0, col: 0, row: 0, x: 0, color: 0 },
    activeTool: null,
    comboChain: 0,
    tickRate: 1200
};

// --- Utils ---
const getTickRateForLevel = (lvl) => {
    if (lvl < 5) return 1200 - ((lvl - 1) * 200);
    if (lvl < 10) return 400 - ((lvl - 5) * 50);
    const progress = (lvl - 10) / 5;
    return Math.floor(180 * (1 - progress) + 60 * progress);
};

const getThresholdForLevel = (lvl) => 1000 + (lvl * 250);

function reducer(state, action) {
    switch (action.type) {
        case 'RESET':
            return {
                ...INITIAL_STATE,
                grid: createEmptyGrid(),
                tickRate: getTickRateForLevel(1)
            };

        case 'TICK_PREVIEW': {
            if (state.gameOver || state.paused) return state;

            let nextIndex = state.previewIndex;
            let nextPreview = [...state.preview];
            let nextGrid = state.grid;
            let nextGameOver = state.gameOver;

            if (nextIndex >= COLS) {
                // DROP ACTION
                // Check if top row is blocked
                for (let c = 0; c < COLS; c++) {
                    if (state.grid[0][c]) {
                        return { ...state, gameOver: true };
                    }
                }

                // Shift grid down? No, in reference implementation:
                // "for (let c = 0; c < COLS; c++) if (prev[c]) nb[0][c] = { ...prev[c], row: 0, col: c };"
                // It writes the preview row directly into row 0.

                // We need to apply this to our grid structure
                const newGrid = state.grid.map(row => [...row]);

                // Writing to row 0
                for (let c = 0; c < COLS; c++) {
                    if (state.preview[c]) {
                        // Check collision again just in case
                        if (newGrid[0][c]) return { ...state, gameOver: true };
                        newGrid[0][c] = state.preview[c];
                    }
                }

                return {
                    ...state,
                    grid: newGrid,
                    preview: Array(8).fill(null),
                    previewIndex: 0,
                    shouldCheckMatches: true // Trigger physics check next
                };

            } else {
                // FILL ONE SLOT
                const colorIdx = Math.floor(Math.random() * COLORS.length);
                nextPreview[nextIndex] = {
                    color: COLORS[colorIdx],
                    id: Math.random().toString(36).substr(2, 9)
                };
                return {
                    ...state,
                    preview: nextPreview,
                    previewIndex: nextIndex + 1
                };
            }
        }

        case 'SWAP': {
            // "Teleport Swap": Swap (x1,y1) with (x2,y2) directly.
            const { x1, y1, x2, y2 } = action;
            const newGrid = state.grid.map(row => [...row]);
            const t1 = newGrid[y1][x1];
            const t2 = newGrid[y2][x2];

            newGrid[y1][x1] = t2;
            newGrid[y2][x2] = t1;

            return {
                ...state,
                grid: newGrid,
                shouldCheckMatches: true,
                comboChain: 1 // Reset combo for manual move? Or set to 1?
            };
        }

        case 'USE_TOOL': {
            const { tool, r, c } = action;
            if (state.inventory[tool] <= 0) return state;

            const newGrid = state.grid.map(row => [...row]);
            let destroyedCount = 0;

            const destroy = (y, x) => {
                if (y >= 0 && y < ROWS && x >= 0 && x < COLS && newGrid[y][x]) {
                    newGrid[y][x] = null;
                    destroyedCount++;
                }
            };

            const targetColor = state.grid[r][c]?.color;

            if (tool === 'radius') {
                for (let i = r - 2; i <= r + 2; i++) {
                    for (let j = c - 2; j <= c + 2; j++) {
                        if (Math.sqrt((i - r) ** 2 + (j - c) ** 2) < 2.5) destroy(i, j);
                    }
                }
            } else if (tool === 'col') {
                for (let i = 0; i < ROWS; i++) destroy(i, c);
            } else if (tool === 'row') {
                for (let j = 0; j < COLS; j++) destroy(r, j);
            } else if (tool === 'x') {
                for (let k = -Math.max(ROWS, COLS); k < Math.max(ROWS, COLS); k++) {
                    destroy(r + k, c + k);
                    destroy(r + k, c - k);
                }
            } else if (tool === 'color' && targetColor) {
                for (let i = 0; i < ROWS; i++)
                    for (let j = 0; j < COLS; j++)
                        if (newGrid[i][j]?.color === targetColor) destroy(i, j);
            }

            const points = destroyedCount * 5;

            return {
                ...state,
                grid: newGrid,
                inventory: { ...state.inventory, [tool]: state.inventory[tool] - 1 },
                activeTool: null,
                score: state.score + points,
                levelScore: state.levelScore + points,
                shouldCheckMatches: true // Gravity needs to happen
            };
        }

        case 'PHYSICS_TICK': {
            // Apply Gravity
            const { grid: gFalls, moved } = applyGravity(state.grid, ROWS, COLS);

            // Check Matches
            const { matches, grid: gMatched } = findMatches(gFalls, ROWS, COLS);

            if (!moved && matches.length === 0) {
                return { ...state, shouldCheckMatches: false };
            }

            let newScore = state.score;
            let newLevelScore = state.levelScore;
            let newInventory = { ...state.inventory };
            let newLevel = state.level;
            let newTickRate = state.tickRate;

            if (matches.length > 0) {
                // Scoring
                const mult = 1; // Simplify for now
                const points = matches.length * 10 * mult; // basic scoring
                newScore += points;
                newLevelScore += points;
            }

            // Level Up Check
            const threshold = getThresholdForLevel(state.level);
            if (newLevelScore >= threshold) {
                newLevel++;
                newLevelScore = 0;
                newTickRate = getTickRateForLevel(newLevel);
                // Grant Reward
                const types = ['radius', 'col', 'row', 'x', 'color'];
                const reward = types[Math.floor(Math.random() * types.length)];
                newInventory[reward]++;
            }

            // Remove matched tiles
            const finalGrid = gMatched.map(r => [...r]);
            matches.forEach(({ x, y }) => {
                finalGrid[y][x] = null;
            });

            return {
                ...state,
                grid: finalGrid,
                score: newScore,
                level: newLevel,
                levelScore: newLevelScore,
                inventory: newInventory,
                tickRate: newTickRate,
                shouldCheckMatches: true // Keep checking until stable
            };
        }

        case 'SELECT_TOOL':
            return { ...state, activeTool: action.tool };

        case 'TOGGLE_PAUSE':
            return { ...state, paused: !state.paused };

        default:
            return state;
    }
}

export function useAnxietyEngine() {
    const [state, dispatch] = useReducer(reducer, INITIAL_STATE);
    const timerRef = useRef(null);
    const physicsRef = useRef(null);

    // Initial Setup
    useEffect(() => {
        dispatch({ type: 'RESET' });
    }, []);

    // Tick Loop (Filling Preview)
    useEffect(() => {
        if (state.gameOver || state.paused) return;

        timerRef.current = setInterval(() => {
            dispatch({ type: 'TICK_PREVIEW' });
        }, state.tickRate);

        return () => clearInterval(timerRef.current);
    }, [state.tickRate, state.gameOver, state.paused]); // Restart timer on rate change

    // Physics Loop (Gravity & Matching)
    useEffect(() => {
        if (state.gameOver || state.paused) return;

        if (state.shouldCheckMatches) {
            physicsRef.current = setTimeout(() => {
                dispatch({ type: 'PHYSICS_TICK' });
            }, 200); // 200ms delay for visual "falling" feeling
        }

        return () => clearTimeout(physicsRef.current);
    }, [state.shouldCheckMatches, state.grid, state.gameOver, state.paused]);


    // Actions
    const swapTiles = (x1, y1, x2, y2) => dispatch({ type: 'SWAP', x1, y1, x2, y2 });
    const useTool = (tool, r, c) => dispatch({ type: 'USE_TOOL', tool, r, c });
    const selectTool = (tool) => dispatch({ type: 'SELECT_TOOL', tool });
    const reset = () => dispatch({ type: 'RESET' });
    const togglePause = () => dispatch({ type: 'TOGGLE_PAUSE' });

    return {
        ...state,
        swapTiles,
        useTool,
        selectTool,
        reset,
        togglePause
    };
}
