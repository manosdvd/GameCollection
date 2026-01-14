// Dimensions
export const ROWS = 10;
export const COLS = 8;
export const TILE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple', 'cyan'];

export const randomColor = () => TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)];

export const createEmptyGrid = () => Array.from({ length: ROWS }, () => Array(COLS).fill(null));

// Initialize grid with bottom N rows filled
export const initGrid = (rowsFilled = 0) => {
    const grid = createEmptyGrid();
    for (let y = ROWS - 1; y >= ROWS - rowsFilled; y--) {
        for (let x = 0; x < COLS; x++) {
            grid[y][x] = { id: Math.random().toString(36).substr(2, 9), color: randomColor() };
        }
    }
    return grid;
};

// Check matches (3+ in a row/col)
// Returns { matches: [{x,y}], grid: matchedGrid } 
// Logic changed: return matches list AND a grid copy where they are marked? 
// No, the reducer expects `{ matches, grid }`.
export const findMatches = (grid, ROWS, COLS) => {
    const matched = new Set();

    // Horizontal
    for (let y = 0; y < ROWS; y++) {
        let currentRun = [];
        for (let x = 0; x < COLS; x++) {
            const tile = grid[y][x];
            if (!tile) {
                if (currentRun.length >= 3) currentRun.forEach(p => matched.add(`${p.x},${p.y}`));
                currentRun = [];
                continue;
            }
            if (currentRun.length > 0 && currentRun[0].color === tile.color) {
                currentRun.push({ x, y, color: tile.color });
            } else {
                if (currentRun.length >= 3) currentRun.forEach(p => matched.add(`${p.x},${p.y}`));
                currentRun = [{ x, y, color: tile.color }];
            }
        }
        if (currentRun.length >= 3) currentRun.forEach(p => matched.add(`${p.x},${p.y}`));
    }

    // Vertical
    for (let x = 0; x < COLS; x++) {
        let currentRun = [];
        for (let y = 0; y < ROWS; y++) {
            const tile = grid[y][x];
            if (!tile) {
                if (currentRun.length >= 3) currentRun.forEach(p => matched.add(`${p.x},${p.y}`));
                currentRun = [];
                continue;
            }
            if (currentRun.length > 0 && currentRun[0].color === tile.color) {
                currentRun.push({ x, y, color: tile.color });
            } else {
                if (currentRun.length >= 3) currentRun.forEach(p => matched.add(`${p.x},${p.y}`));
                currentRun = [{ x, y, color: tile.color }];
            }
        }
        if (currentRun.length >= 3) currentRun.forEach(p => matched.add(`${p.x},${p.y}`));
    }

    // Return unique matches
    const matchesList = Array.from(matched).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
    });

    // Return grid copy (unchanged, just passed through)
    return { matches: matchesList, grid: grid };
};

// Apply gravity: Move tiles down to fill empty spaces
export const applyGravity = (grid, ROWS, COLS) => {
    const newGrid = grid.map(row => [...row]);
    let moved = false;

    for (let x = 0; x < COLS; x++) {
        let writeY = ROWS - 1;
        for (let y = ROWS - 1; y >= 0; y--) {
            if (newGrid[y][x] !== null) {
                if (writeY !== y) {
                    newGrid[writeY][x] = newGrid[y][x];
                    newGrid[y][x] = null;
                    moved = true;
                }
                writeY--;
            }
        }
    }
    return { grid: newGrid, moved };
};
