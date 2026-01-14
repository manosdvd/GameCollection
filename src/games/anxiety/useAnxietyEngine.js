import { useReducer, useEffect, useCallback } from 'react';
import { initGrid, findMatches, applyGravity, randomColor, COLS, ROWS } from './anxietyUtils';

const INTERVAL_BASE = 1000; // ms per preview tick

const initialState = {
    grid: initGrid(4),
    preview: [], // Array of colored tiles waiting
    score: 0,
    level: 1,
    gameOver: false,
    previewTick: 0, // Progress 0-8 for filling preview, 9 for drop warning
    combo: 1
};

function anxietyReducer(state, action) {
    if (state.gameOver && action.type !== 'RESET') return state;

    switch (action.type) {
        case 'RESET':
            return { ...initialState, grid: initGrid(4) };

        case 'SWAP': {
            const { x1, y1, x2, y2 } = action.payload;
            const newGrid = state.grid.map(r => [...r]);
            const t1 = newGrid[y1][x1];
            const t2 = newGrid[y2][x2];
            newGrid[y1][x1] = t2;
            newGrid[y2][x2] = t1;

            // Check matches immediately? Or next tick? 
            // Design: Immediate match check.
            return { ...state, grid: newGrid };
        }

        case 'TICK': {
            // 1. Fill Preview
            let nextPreview = [...state.preview];
            let nextTick = state.previewTick + 1;
            let nextGrid = state.grid;
            let nextGameOver = state.gameOver;

            // Speed up based on level
            // handled in useInterval delay, here we just process logic

            if (state.preview.length < COLS) {
                // Add one tile
                nextPreview.push({ id: Math.random(), color: randomColor() });
            } else {
                // Preview full, Warning phase or Drop?
                // Let's say when preview is full (8 items), we wait one more tick (warning), then drop.
                // Actually simplification: Fill 1..8. Next tick (9) is DROP.

                if (nextTick > COLS) {
                    // DROP!
                    // Check logic: Can we drop? 
                    // If any column has a tile in row 0, and we drop, does it push it off? 
                    // "The game ends when a box is already in the top row... when the preview bar drops"

                    // Check top row validity
                    for (let x = 0; x < COLS; x++) {
                        if (nextGrid[0][x] !== null) {
                            nextGameOver = true;
                        }
                    }

                    if (!nextGameOver) {
                        // Push everything down
                        nextGrid = nextGrid.map(r => [...r]);
                        // Move all rows down 1
                        for (let y = ROWS - 1; y > 0; y--) {
                            nextGrid[y] = nextGrid[y - 1];
                        }
                        // Insert preview row at top
                        nextGrid[0] = nextPreview.map(p => ({ id: Math.random().toString(36), color: p.color }));
                        nextPreview = [];
                        nextTick = 0;
                    }
                }
            }

            return {
                ...state,
                preview: nextPreview,
                previewTick: nextTick,
                grid: nextGrid,
                gameOver: nextGameOver
            };
        }

        case 'MATCH_AND_GRAVITY': {
            // Called frequently to resolve board state
            let newGrid = state.grid; // ref ref
            const matches = findMatches(newGrid);
            if (matches.length > 0) {
                // Remove
                newGrid = newGrid.map(r => [...r]);
                matches.forEach(({ x, y }) => {
                    newGrid[y][x] = null;
                });
                // Score
                const newScore = state.score + (matches.length * 10 * state.combo);
                return { ...state, grid: newGrid, score: newScore, combo: state.combo + 1 };
            } else {
                // Gravity
                const gravityResult = applyGravity(newGrid);
                if (gravityResult.moved) {
                    return { ...state, grid: gravityResult.grid };
                } else {
                    // Stable
                    return { ...state, combo: 1 };
                }
            }
        }

        default:
            return state;
    }
}

export function useAnxietyEngine(eventHandlers) {
    const [state, dispatch] = useReducer(anxietyReducer, initialState);

    // Game Loop (Gravity & Matching)
    useEffect(() => {
        if (state.gameOver) return;
        const interval = setInterval(() => {
            dispatch({ type: 'MATCH_AND_GRAVITY' });
        }, 200); // 5fps for physics/matching check
        return () => clearInterval(interval);
    }, [state.gameOver, state.grid]); // Dep on grid to re-check stable state? Or just run constantly? Constantly is safer for animations.

    // Preview Tick Loop
    useEffect(() => {
        if (state.gameOver) return;
        const speed = Math.max(100, INTERVAL_BASE - (state.level * 50));
        const interval = setInterval(() => {
            dispatch({ type: 'TICK' });
        }, speed);
        return () => clearInterval(interval);
    }, [state.gameOver, state.level]);

    const swapTiles = useCallback((x1, y1, x2, y2) => {
        if (state.gameOver) return;
        // Distant swapping allows any swap
        dispatch({ type: 'SWAP', payload: { x1, y1, x2, y2 } });
    }, [state.gameOver]);

    const reset = useCallback(() => dispatch({ type: 'RESET' }), []);

    return {
        ...state,
        swapTiles,
        reset
    };
}
