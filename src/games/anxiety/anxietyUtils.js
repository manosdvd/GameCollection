export const COLS = 8;
export const ROWS = 8;
export const TILE_COLORS = ['red', 'blue', 'green', 'yellow', 'purple'];

export const randomColor = () => TILE_COLORS[Math.floor(Math.random() * TILE_COLORS.length)];

export const createEmptyGrid = () => Array(ROWS).fill(null).map(() => Array(COLS).fill(null));

// Initialize grid with bottom N rows filled
export const initGrid = (rowsFilled = 4) => {
    const grid = createEmptyGrid();
    for (let y = ROWS - 1; y >= ROWS - rowsFilled; y--) {
        for (let x = 0; x < COLS; x++) {
            grid[y][x] = { id: Math.random().toString(36).substr(2, 9), color: randomColor() };
        }
    }
    return grid;
};

// Check for matches (3+ in a row/col)
// Returns array of {x, y} to remove
export const findMatches = (grid) => {
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

    return Array.from(matched).map(s => {
        const [x, y] = s.split(',').map(Number);
        return { x, y };
    });
};

// Apply gravity: Move tiles down to fill empty spaces
export const applyGravity = (grid) => {
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
