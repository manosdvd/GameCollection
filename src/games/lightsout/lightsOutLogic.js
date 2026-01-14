export const ROWS = 5;
export const COLS = 5;

// Toggle a cell and its neighbors
export const toggle = (grid, x, y) => {
    const newGrid = [...grid]; // Copy array
    const index = y * COLS + x;

    // Toggle self
    newGrid[index] = !newGrid[index];

    // Toggle Neighbors
    if (x > 0) newGrid[index - 1] = !newGrid[index - 1]; // Left
    if (x < COLS - 1) newGrid[index + 1] = !newGrid[index + 1]; // Right
    if (y > 0) newGrid[index - COLS] = !newGrid[index - COLS]; // Up
    if (y < ROWS - 1) newGrid[index + COLS] = !newGrid[index + COLS]; // Down

    return newGrid;
};

// Check if solved (all false/off)
export const isSolved = (grid) => grid.every(val => !val);

// Create a solvable puzzle by starting solved and applying random moves
export const createProblem = (moves = 10) => {
    let grid = Array(ROWS * COLS).fill(false);
    for (let i = 0; i < moves; i++) {
        const x = Math.floor(Math.random() * COLS);
        const y = Math.floor(Math.random() * ROWS);
        grid = toggle(grid, x, y);
    }
    return grid;
};

// --- Solver Logic (Gaussian Elimination over GF(2)) ---

// Returns the solution vector (array of indices to click) to solve the board (make all 0)
// For Lights Out, "solving" means reaching the all-zero state. 
// Ax = b, where b is current state, x is moves to make.
export const solve = (grid) => {
    const size = ROWS * COLS;

    // Build Matrix A (transform matrix)
    // A[i][j] = 1 if clicking j affects i
    const buildMatrix = () => {
        const mat = [];
        for (let i = 0; i < size; i++) {
            const row = Array(size).fill(0);
            const r = Math.floor(i / COLS);
            const c = i % COLS;

            row[i] = 1; // Self
            if (c > 0) row[i - 1] = 1; // Left
            if (c < COLS - 1) row[i + 1] = 1; // Right
            if (r > 0) row[i - COLS] = 1; // Up
            if (r < ROWS - 1) row[i + COLS] = 1; // Down
            mat.push(row);
        }
        return mat;
    };

    let mat = buildMatrix();
    // Copy grid as standard vector (b)
    // We want to turn OFF lights. If a light is ON (1), we need to toggle it effectively an odd number of times to turn it OFF.
    // Actually, in GF(2), A*x = b.
    let vec = grid.map(v => v ? 1 : 0);

    // Augmented Matrix [A | b]
    for (let i = 0; i < size; i++) {
        mat[i].push(vec[i]);
    }

    // Gaussian Elimination
    let col = 0;
    for (let row = 0; row < size && col < size; row++, col++) {
        // Pivot
        if (mat[row][col] === 0) {
            let r = row + 1;
            while (r < size && mat[r][col] === 0) r++;
            if (r < size) {
                // Swap
                [mat[row], mat[r]] = [mat[r], mat[row]];
            } else {
                // No pivot in this col, continue
                row--;
                continue;
            }
        }

        // Eliminate
        for (let i = 0; i < size; i++) {
            if (i !== row && mat[i][col] === 1) {
                for (let j = col; j <= size; j++) {
                    mat[i][j] ^= mat[row][j];
                }
            }
        }
    }

    // Back substitution (already effectively done by full elimination to I)
    // Extract solution
    const solution = [];
    for (let i = 0; i < size; i++) {
        if (mat[i][size] === 1) { // Last column is the result
            const x = i % COLS;
            const y = Math.floor(i / COLS);
            solution.push({ x, y, index: i });
        }
    }

    return solution;
};
