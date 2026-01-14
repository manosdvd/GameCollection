// --- RNG (Mulberry32) ---
let rngState = 0;

function seedRNG(str) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < str.length; i++) {
        h = Math.imul(h ^ str.charCodeAt(i), 16777619);
    }
    rngState = h >>> 0;
}

function rand() {
    let t = rngState += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
}

// --- Constants ---
const DIRS = [1, 2, 4, 8, 16, 32];
const NEIGHBOR_OFFSETS = [
    [[0, -1], [1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1]],
    [[1, -1], [1, 0], [1, 1], [0, 1], [-1, 0], [0, -1]]
];

// SoundManager removed in favor of SoundContext via React wrapper

class Tile {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.baseShape = 0;
        this.rotation = 0;
        this.isAnchor = false;
        this.tempConns = 0;
        this.wrapper = null;
        this.inner = null;
        this.domParts = {
            center: null,
            arms: [null, null, null, null, null, null]
        };
    }

    getConnections() {
        let s = this.baseShape;
        let r = this.rotation;
        let nc = 0;
        for (let i = 0; i < 6; i++) {
            if (s & (1 << i)) {
                let shift = (i + r) % 6;
                if (shift < 0) shift += 6;
                nc |= (1 << shift);
            }
        }
        return nc;
    }

    setRotation(r) {
        this.rotation = r;
        this.updateTransform();
    }

    rotate() {
        if (this.isAnchor) {
            this.inner.style.transform = `rotate(${this.rotation * 60}deg) scale(0.9)`;
            setTimeout(() => this.updateTransform(), 100);
            return;
        }
        this.rotation++;
        this.updateTransform();
    }

    updateTransform() {
        if (this.inner) {
            this.inner.style.transform = `rotate(${this.rotation * 60}deg)`;
        }
    }

    setVisuals(mask) {
        if (!this.domParts.center) return;
        const toggle = (el, on) => {
            if (!el) return;
            if (on) el.classList.add('lit');
            else el.classList.remove('lit');
        };
        toggle(this.domParts.center, mask & 1);
        if (this.isAnchor && (mask & 1)) this.domParts.center.classList.add('anchor-lit');
        else this.domParts.center.classList.remove('anchor-lit');

        for (let i = 0; i < 6; i++) {
            toggle(this.domParts.arms[i], mask & (1 << (i + 1)));
        }
    }
}

export class HexEnergyEngine {
    constructor(container, callbacks, audioInterface) {
        this.container = container;
        this.callbacks = callbacks || {};
        this.audio = audioInterface || {
            playClick: () => { },
            playVictory: () => { },
            playTone: () => { }
        };

        this.grid = [];
        this.GRID_W = 4;
        this.GRID_H = 4;
        this.TILE_R = 40;
        this.level = 1;

        this.startNode = null;
        this.endNodes = [];
        this.isInputLocked = false;
        this.flowAnimationId = 0;

        this.moves = 0;
        this.timer = 0;
        this.timerInterval = null;

        this.particles = [];
        this.isAnimating = false;

        // Bind context
        this.handleResize = this.handleResize.bind(this);
        window.addEventListener('resize', this.handleResize);

        // Particle Canvas
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'absolute';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '50';
        // Append to body or container? Body is safer for full screen particles
        // But container is cleaner for cleanup. Let's try container.
        this.container.appendChild(this.canvas);
        this.ctx = this.canvas.getContext('2d');
    }

    destroy() {
        window.removeEventListener('resize', this.handleResize);
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.container.innerHTML = ''; // Dangerous if React manages it?
        // Actually, we should just remove what we added.
        // We will assume container is empty when passed.
    }

    handleResize() {
        this.updateLayout();
        this.canvas.width = this.container.clientWidth;
        this.canvas.height = this.container.clientHeight;
    }

    loadLevel(levelIndex) {
        this.level = levelIndex;
        // Logic from newPuzzle
        let sizeIndex = this.level - 1;
        let base = 4;
        let w = base + Math.floor(sizeIndex / 2);
        let h = base + Math.ceil(sizeIndex / 2);
        if (w > 12) w = 12;
        if (h > 12) h = 12;

        const seedVal = Math.floor(Math.random() * 900000) + 100000;
        const seedCode = `${w}x${h}:${seedVal}`;
        this.loadGameFromSeed(seedCode);
    }

    reset() {
        if (this.currentSeedCode) this.loadGameFromSeed(this.currentSeedCode);
    }

    loadGameFromSeed(seedCode) {
        let [dims, sVal] = seedCode.split(':');
        let [w, h] = dims.split('x').map(Number);

        this.GRID_W = w;
        this.GRID_H = h;
        this.currentSeedCode = seedCode;

        this.moves = 0;
        this.timer = 0;
        if (this.timerInterval) clearInterval(this.timerInterval);
        this.timerInterval = setInterval(() => {
            this.timer++;
            if (this.callbacks.onStats) this.callbacks.onStats(this.moves, this.timer);
        }, 1000);

        seedRNG(sVal);
        this.generateLevel();
        this.isInputLocked = false;

        if (this.callbacks.onStats) this.callbacks.onStats(this.moves, this.timer);
    }

    getNeighborCoords(x, y, dirIndex) {
        const parity = y & 1;
        let [dx, dy] = NEIGHBOR_OFFSETS[parity][dirIndex];
        return { x: x + dx, y: y + dy };
    }

    getNeighbors(x, y) {
        let res = [];
        for (let i = 0; i < 6; i++) {
            let c = this.getNeighborCoords(x, y, i);
            if (c.x >= 0 && c.x < this.GRID_W && c.y >= 0 && c.y < this.GRID_H) {
                let oppIndex = (i + 3) % 6;
                res.push({
                    t: this.grid[c.y][c.x],
                    dir: (1 << i),
                    opp: (1 << oppIndex),
                    idx: i
                });
            }
        }
        return res;
    }

    generateLevel() {
        this.grid = [];
        // Clear previous grid elements (keeping canvas)
        const existingGrid = document.getElementById('hex-grid');
        if (existingGrid) existingGrid.remove();

        const gridEl = document.createElement('div');
        gridEl.id = 'hex-grid';
        this.container.appendChild(gridEl);
        this.gridEl = gridEl;

        this.endNodes = [];

        // 1. Grid
        for (let y = 0; y < this.GRID_H; y++) {
            let row = [];
            for (let x = 0; x < this.GRID_W; x++) row.push(new Tile(x, y));
            this.grid.push(row);
        }

        // 2. Prim's
        let visited = new Set();
        let stack = [];
        let startX = Math.floor(rand() * this.GRID_W);
        let startY = Math.floor(rand() * this.GRID_H);

        let first = this.grid[startY][startX];
        stack.push(first);
        visited.add(first);

        while (stack.length > 0) {
            let curr = stack[stack.length - 1];
            let neighbors = this.getNeighbors(curr.x, curr.y).filter(n => !visited.has(n.t));

            if (neighbors.length > 0) {
                let next = neighbors[Math.floor(rand() * neighbors.length)];
                curr.tempConns |= next.dir;
                next.t.tempConns |= next.opp;
                visited.add(next.t);
                stack.push(next.t);
            } else {
                stack.pop();
            }
        }

        // 3. Anchors / Sinks logic (Simplified from original for brevity but keeping core)
        let leaves = [];
        for (let row of this.grid) for (let t of row) {
            let d = 0; for (let i = 0; i < 6; i++) if (t.tempConns & (1 << i)) d++;
            if (d === 1) leaves.push(t);
        }

        if (leaves.length < 2) {
            let all = this.grid.flat();
            leaves = [all[0], all[all.length - 1]];
        }

        this.startNode = leaves.splice(Math.floor(rand() * leaves.length), 1)[0];
        this.startNode.isAnchor = true;

        let numSinks = Math.min(leaves.length, Math.floor(rand() * 2) + 2);
        if (numSinks < 1) numSinks = 1;

        for (let i = 0; i < numSinks; i++) {
            if (leaves.length > 0) {
                let sink = leaves.splice(Math.floor(rand() * leaves.length), 1)[0];
                sink.isAnchor = true;
                this.endNodes.push(sink);
            }
        }

        // 4. Dead Ends
        let healing = true;
        while (healing) {
            healing = false;
            for (let row of this.grid) {
                for (let t of row) {
                    if (t.isAnchor) continue;
                    let d = 0; for (let i = 0; i < 6; i++) if (t.tempConns & (1 << i)) d++;
                    if (d <= 1) {
                        let ns = this.getNeighbors(t.x, t.y);
                        let valid = ns.filter(n => !(t.tempConns & n.dir));
                        if (valid.length > 0) {
                            let next = valid[Math.floor(rand() * valid.length)];
                            t.tempConns |= next.dir;
                            next.t.tempConns |= next.opp;
                            healing = true;
                        }
                    }
                }
            }
        }

        // Finalize
        for (let row of this.grid) {
            for (let t of row) {
                t.baseShape = t.tempConns;
                delete t.tempConns;
            }
        }

        this.createGridDOM();
        this.scramble();
        // Delay layout update slightly to ensure DOM is ready? 
        // No, synchronous is fine.
        this.handleResize(); // Triggers updateLayout
        this.triggerFlowCalc();
    }

    scramble() {
        for (let row of this.grid) for (let t of row) {
            if (!t.isAnchor) t.setRotation(Math.floor(rand() * 6));
        }
    }

    createGridDOM() {
        const CX = 50, CY = 57.5, SVG_R = 45;
        const ANGLES = [-60, 0, 60, 120, 180, 240];
        const getEnd = (i) => ({
            x: CX + SVG_R * Math.cos(ANGLES[i] * Math.PI / 180),
            y: CY + SVG_R * Math.sin(ANGLES[i] * Math.PI / 180)
        });
        const ns = "http://www.w3.org/2000/svg";

        for (let y = 0; y < this.GRID_H; y++) {
            for (let x = 0; x < this.GRID_W; x++) {
                let t = this.grid[y][x];

                let wrapper = document.createElement('div');
                wrapper.className = 'hex-wrapper';
                wrapper.onpointerdown = (e) => this.handleTap(t);

                let inner = document.createElement('div');
                inner.className = 'hex-inner';
                if (t.isAnchor) inner.classList.add('anchor');
                if (t.isAnchor) inner.classList.add('locked');

                const svg = document.createElementNS(ns, "svg");
                svg.setAttribute("viewBox", "0 0 100 115");

                let dStatic = "";
                for (let i = 0; i < 6; i++) {
                    if (t.baseShape & (1 << i)) {
                        let pt = getEnd(i);
                        dStatic += `M ${CX} ${CY} L ${pt.x} ${pt.y} `;
                    }
                }

                const track = document.createElementNS(ns, "path");
                track.setAttribute("d", dStatic);
                track.setAttribute("class", "pipe-track");
                svg.appendChild(track);

                const wire = document.createElementNS(ns, "path");
                wire.setAttribute("d", dStatic);
                wire.setAttribute("class", "pipe-wire");
                svg.appendChild(wire);

                for (let i = 0; i < 6; i++) {
                    if (t.baseShape & (1 << i)) {
                        let pt = getEnd(i);
                        const p = document.createElementNS(ns, "path");
                        p.setAttribute("d", `M ${CX} ${CY} L ${pt.x} ${pt.y}`);
                        p.setAttribute("class", `fluid-segment`);
                        t.domParts.arms[i] = p;
                        svg.appendChild(p);
                    }
                }

                const center = document.createElementNS(ns, "circle");
                center.setAttribute("cx", CX); center.setAttribute("cy", CY);
                center.setAttribute("r", 7); center.setAttribute("class", "node-base");
                svg.appendChild(center);

                const fCenter = document.createElementNS(ns, "circle");
                fCenter.setAttribute("cx", CX); fCenter.setAttribute("cy", CY);
                fCenter.setAttribute("r", 7); fCenter.setAttribute("class", "fluid-center");
                svg.appendChild(fCenter);
                t.domParts.center = fCenter;

                inner.appendChild(svg);
                wrapper.appendChild(inner);
                this.gridEl.appendChild(wrapper);

                t.wrapper = wrapper;
                t.inner = inner;
                t.updateTransform();
            }
        }
    }

    handleTap(tile) {
        if (this.isInputLocked) return;
        if (this.audio.triggerHaptic) this.audio.triggerHaptic(5);

        if (!tile.isAnchor) {
            this.moves++;
            this.audio.playClick();
            if (this.callbacks.onStats) this.callbacks.onStats(this.moves, this.timer);
        }

        tile.rotate();
        this.triggerFlowCalc();
    }

    triggerFlowCalc() {
        this.flowAnimationId++;
        const currentFlowId = this.flowAnimationId;

        let queue = [this.startNode];
        let poweredSet = new Set([this.startNode]);
        let distMap = new Map(); distMap.set(this.startNode, 0);

        let head = 0;
        while (head < queue.length) {
            let curr = queue[head++];
            let cConns = curr.getConnections();
            let dist = distMap.get(curr);
            const parity = curr.y & 1;

            for (let i = 0; i < 6; i++) {
                let dirMask = 1 << i;
                if (!(cConns & dirMask)) continue;

                let [dx, dy] = NEIGHBOR_OFFSETS[parity][i];
                let nx = curr.x + dx;
                let ny = curr.y + dy;

                if (nx >= 0 && nx < this.GRID_W && ny >= 0 && ny < this.GRID_H) {
                    let nTile = this.grid[ny][nx];
                    let oppIndex = (i + 3) % 6;
                    let oppMask = 1 << oppIndex;

                    if (nTile.getConnections() & oppMask) {
                        if (!poweredSet.has(nTile)) {
                            poweredSet.add(nTile);
                            distMap.set(nTile, dist + 1);
                            queue.push(nTile);
                        }
                    }
                }
            }
        }

        let totalSections = 0;
        let litSections = 0;
        let maxDist = 0;

        for (let row of this.grid) {
            for (let t of row) {
                let d = distMap.get(t) || 0;
                if (d > maxDist) maxDist = d;
                let deg = 0; for (let i = 0; i < 6; i++) if (t.baseShape & (1 << i)) deg++;
                totalSections += (deg + 1);

                if (!poweredSet.has(t)) {
                    t.setVisuals(0);
                    continue;
                }

                let mask = 1;
                litSections++;
                for (let i = 0; i < 6; i++) {
                    if (t.baseShape & (1 << i)) {
                        let worldIdx = (i + t.rotation) % 6;
                        if (worldIdx < 0) worldIdx += 6;
                        let c = this.getNeighborCoords(t.x, t.y, worldIdx);
                        if (c.x >= 0 && c.x < this.GRID_W && c.y >= 0 && c.y < this.GRID_H) {
                            let nTile = this.grid[c.y][c.x];
                            if (poweredSet.has(nTile)) {
                                let oppShift = (worldIdx + 3) % 6;
                                let oppMask = 1 << oppShift;
                                if (nTile.getConnections() & oppMask) {
                                    mask |= (1 << (i + 1));
                                    litSections++;
                                }
                            }
                        }
                    }
                }

                setTimeout(() => {
                    if (this.flowAnimationId === currentFlowId) t.setVisuals(mask);
                }, d * 40);
            }
        }

        setTimeout(() => {
            if (this.flowAnimationId === currentFlowId) {
                let pct = totalSections > 0 ? Math.floor((litSections / totalSections) * 100) : 0;
                if (this.callbacks.onProgress) this.callbacks.onProgress(pct);

                if (litSections === totalSections && totalSections > 0) {
                    this.triggerVictory();
                }
            }
        }, maxDist * 40 + 100);
    }

    triggerVictory() {
        this.isInputLocked = true;
        clearInterval(this.timerInterval);
        this.audio.playVictory();
        this.endNodes.forEach(sink => this.spawnParticles(sink));
        if (this.callbacks.onVictory) this.callbacks.onVictory();
    }

    updateLayout() {
        if (!this.gridEl) return;

        let safeW = this.container.clientWidth;
        let safeH = this.container.clientHeight;

        let hexW_factor = 1.732;
        let gridW_units = (this.GRID_W + 0.5) * hexW_factor;
        let gridH_units = 2 + (this.GRID_H - 1) * 1.5;

        let r_w = safeW / gridW_units;
        let r_h = safeH / gridH_units;
        let R = Math.min(r_w, r_h);

        if (R > 55) R = 55;
        if (R < 18) R = 18;

        this.TILE_R = R;

        let pxW = gridW_units * R;
        let pxH = gridH_units * R;

        this.gridEl.style.width = `${pxW}px`;
        this.gridEl.style.height = `${pxH}px`;

        const W = 1.732 * this.TILE_R;
        const H = 2 * this.TILE_R;
        const VertDist = 1.5 * this.TILE_R;

        // Center the grid in the container
        // gridEl uses margin:auto but that only works if parent has flex centering?
        // We set styles on gridEl, but absolute positioning of children is relative to gridEl.
        // So as long as gridEl dimensions are correct, margin:auto does the job if we used it.
        // In the original CSS, #grid had margin:auto.

        for (let y = 0; y < this.GRID_H; y++) {
            for (let x = 0; x < this.GRID_W; x++) {
                let t = this.grid[y][x];
                if (t && t.wrapper) {
                    let left = x * W + ((y % 2) * (W / 2));
                    let top = y * VertDist;
                    t.wrapper.style.width = `${W}px`;
                    t.wrapper.style.height = `${H}px`;
                    t.wrapper.style.left = `${left}px`;
                    t.wrapper.style.top = `${top}px`;
                }
            }
        }
    }

    spawnParticles(tile) {
        if (!tile.wrapper) return;
        // Need screen coords or canvas coords? Canvas is same size as container.
        // We need coords relative to container.

        let rect = tile.wrapper.getBoundingClientRect();
        let containerRect = this.container.getBoundingClientRect();

        // Relative x/y
        let cx = (rect.left - containerRect.left) + rect.width / 2;
        let cy = (rect.top - containerRect.top) + rect.height / 2;

        for (let i = 0; i < 50; i++) {
            this.particles.push({
                x: cx, y: cy,
                vx: (Math.random() - 0.5) * 15, vy: (Math.random() - 0.5) * 15,
                life: 1, size: Math.random() * 5 + 2
            });
        }
        if (!this.isAnimating) this.animateParticles();
    }

    animateParticles() {
        if (this.particles.length === 0) { this.isAnimating = false; return; }
        this.isAnimating = true;
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        for (let i = this.particles.length - 1; i >= 0; i--) {
            let p = this.particles[i];
            p.x += p.vx; p.y += p.vy;
            p.vx *= 0.94; p.vy *= 0.94;
            p.life -= 0.025;
            this.ctx.fillStyle = `rgba(0, 255, 170, ${p.life})`;
            this.ctx.beginPath(); this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); this.ctx.fill();
            if (p.life <= 0) this.particles.splice(i, 1);
        }
        requestAnimationFrame(this.animateParticles.bind(this));
    }
}
