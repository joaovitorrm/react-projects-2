"use client"

import { useCallback, useEffect, useState } from "react"
import styles from "./page.module.css"

const BOARD_SIZE = 8;

const piecesNames = {
    king: { white: "♔", black: "♚" },
    queen: { white: "♕", black: "♛" },
    rook: { white: "♖", black: "♜" },
    bishop: { white: "♗", black: "♝" },
    knight: { white: "♘", black: "♞" },
    pawn: { white: "♙", black: "♟" },
}

type PiecesNames = keyof typeof piecesNames;

const piecesStartPatternWhite: PiecesNames[] =
    [
        "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn",
        "rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook"
    ]

const piecesStartPatternBlack: PiecesNames[] =
    [
        "rook", "knight", "bishop", "queen", "king", "bishop", "knight", "rook",
        "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn", "pawn"
    ]


type Piece = {
    name: PiecesNames,
    color: "black" | "white",
    hasMoved: boolean
}

type Grid = (Piece | null)[][];

function isOutOfGrid(x: number, y: number): boolean {
    return (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE);
}

function isInCheck(grid: Grid, color: "white" | "black"): boolean {
    let king: [number, number];

    grid.forEach((row, y) => row.forEach((p, x) => {
        if (p !== null) {
            if (p.name === "king" && p.color === color) king = [x, y];
        };
    }));

    for (let y = 0; y < grid.length; y++) {
        for (let x = 0; x < grid[y].length; x++) {
            if (grid[y][x] === null || grid[y][x]!.color === color) continue;

            if (validMoves[grid[y][x]!.name](grid, x, y).attacks.some(([mx, my]) => mx === king[0] && my === king[1])) return true;
        }
    }

    return false;
}

function wouldBeInCheck(grid: Grid, fromX: number, fromY: number, toX: number, toY: number): boolean {
    const newGrid = applyMove(grid, fromX, fromY, toX, toY);
    return isInCheck(newGrid, newGrid[toY][toX]!.color);
}

function applyMove(grid: Grid, fromX: number, fromY: number, toX: number, toY: number): Grid {
    const copy = grid.map(row => [...row]);
    copy[toY][toX] = { ...copy[fromY][fromX]!, hasMoved: true };
    copy[fromY][fromX] = null;
    return copy;
}

type ValidMoves = {
    moves: [number, number][],
    attacks: [number, number][],
    special?: [number, number][]
}

const validMoves: Record<PiecesNames, (grid: Grid, x: number, y: number) => ValidMoves> = {
    bishop: (grid: Grid, x: number, y: number) => {

        const piece = grid[y][x]!;
        const moves: [number, number][] = [];
        const attacks: [number, number][] = [];
        const directions = [[-1, -1], [1, 1], [-1, 1], [1, -1]];

        for (const [dy, dx] of directions) {

            let posX = x + dx;
            let posY = y + dy;

            if (isOutOfGrid(posX, posY)) continue;

            while (grid[posY][posX] === null) {
                moves.push([posX, posY]);
                posX += dx;
                posY += dy;
                if (isOutOfGrid(posX, posY)) break;
            }

            if (!isOutOfGrid(posX, posY) && grid[posY][posX]!.color !== piece.color) {
                attacks.push([posX, posY]);
            }
        }

        return { moves, attacks };
    },
    king: (grid: Grid, x: number, y: number) => {

        const piece = grid[y][x]!;
        const moves: [number, number][] = [];
        const attacks: [number, number][] = [];
        const special: [number, number][] = [];
        const spaces = [[-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]];

        for (const [my, mx] of spaces) {
            const posX = mx + x;
            const posY = my + y;

            if (isOutOfGrid(posX, posY)) continue;

            if (grid[posY][posX] === null)
                moves.push([posX, posY]);
            else if (grid[posY][posX]!.color !== piece.color)
                attacks.push([posX, posY]);
        }

        if (!piece.hasMoved) {
            [1, -1].forEach((n) => {
                let c = n;
                while ((x + c) < BOARD_SIZE && (x + c) >= 0) {
                    if (grid[y][x + c] !== null) {
                        const p = grid[y][x + c]!
                        if (p.name === "rook" && !p.hasMoved && p.color === piece.color) {
                            special.push([n > 0 ? x + 2 : x - 2, y]);
                        }
                        break;
                    }
                    if (wouldBeInCheck(grid, x, y, x + c, y)) break;
                    c += n;
                }
            })
        }

        return { moves, attacks, special };
    },
    knight: (grid: Grid, x: number, y: number) => {

        const piece = grid[y][x]!;
        const moves: [number, number][] = [];
        const attacks: [number, number][] = [];
        const color = piece.color;

        const spaces = [[-2, -1], [-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2]];

        for (const [my, mx] of spaces) {
            const posX = mx + x;
            const posY = my + y;

            if (isOutOfGrid(posX, posY)) continue;

            if (grid[posY][posX] === null)
                moves.push([posX, posY]);
            else if (grid[posY][posX].color !== color)
                attacks.push([posX, posY]);
        }

        return { moves, attacks };
    },
    pawn: (grid: Grid, x: number, y: number) => {

        const piece = grid[y][x]!;
        const moves: [number, number][] = [];
        const attacks: [number, number][] = [];
        const special: [number, number][] = [];
        const dir = piece.color === "black" ? 1 : -1;

        if (grid[y + dir]?.[x] === null) {
            moves.push([x, y + dir]);
            if (!piece.hasMoved && grid[y + dir * 2]?.[x] === null) {
                moves.push([x, y + dir * 2]);
            }
        }

        [1, -1].forEach((v) => {
            if (!isOutOfGrid(x + v, y + dir) && grid[y + dir][x + v] !== null && grid[y + dir][x + v]?.color !== piece.color)
                attacks.push([x + v, y + dir]);
        })

        return { moves, attacks, special };
    },
    queen: (grid: Grid, x: number, y: number) => {
        const piece = grid[y][x]!;
        const moves: [number, number][] = [];
        const attacks: [number, number][] = [];
        const directions = [[-1, -1], [-1, 0], [-1, 1], [0, 1], [1, 1], [1, 0], [1, -1], [0, -1]];

        for (const [dy, dx] of directions) {

            let posX = x + dx;
            let posY = y + dy;

            if (isOutOfGrid(posX, posY)) continue;

            while (grid[posY][posX] === null) {
                moves.push([posX, posY]);
                if (grid[posY][posX] !== null) break;
                posX += dx;
                posY += dy;
                if (isOutOfGrid(posX, posY)) break;
            }

            if (!isOutOfGrid(posX, posY) && grid[posY][posX]!.color !== piece.color)
                attacks.push([posX, posY]);
        }

        return { moves, attacks };
    },
    rook: (grid: Grid, x: number, y: number) => {
        const piece = grid[y][x]!;
        const moves: [number, number][] = [];
        const attacks: [number, number][] = [];
        const directions = [[-1, 0], [0, 1], [1, 0], [0, -1]];

        for (const [dy, dx] of directions) {

            let posX = x + dx;
            let posY = y + dy;

            if (isOutOfGrid(posX, posY)) continue;

            while (grid[posY][posX] === null) {
                moves.push([posX, posY]);
                posX += dx;
                posY += dy;
                if (isOutOfGrid(posX, posY)) break;
            }

            if (!isOutOfGrid(posX, posY) && grid[posY][posX]!.color !== piece.color)
                attacks.push([posX, posY]);
        }

        return { moves, attacks };
    },
}

function generateGrid(): (Piece | null)[][] {
    const size = BOARD_SIZE;
    const createdGrid = Array.from({ length: size }, () => new Array<Piece | null>(size).fill(null));

    piecesStartPatternBlack.forEach((p, i) => {
        createdGrid[Math.floor(i / size)][i - Math.floor(i / size) * size] = { color: "black", name: p, hasMoved: false };
    })

    piecesStartPatternWhite.forEach((p, i) => {
        createdGrid[Math.floor(i / size + size - 2)][i - Math.floor(i / size) * size] = { color: "white", name: p, hasMoved: false };
    })

    return createdGrid;
}

function checkIsMate(grid: Grid, color: "black" | "white"): boolean {
    let hasMove = 0;
    grid.forEach((row, y) => row.forEach((p, x) => {
        if (p === null || p.color !== color) return;

        const result = validMoves[p.name](grid, x, y);

        const moves = result.moves.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));
        const attacks = result.attacks.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));

        if (moves.length > 0 || attacks.length > 0) hasMove++;
    }));

    return hasMove === 0;
}

type OverlayElement = {
    type: "move" | "attack",
    action: (grid: Grid, x: number, y: number) => void,
    x: number,
    y: number,
}

function Timer({ running, initialTime }: { running: boolean, initialTime: number }) {
    const [seconds, setSeconds] = useState(initialTime);

    useEffect(() => {
        if (!running) return;
        const id = setInterval(() => setSeconds(s => Math.max(0, s - 1)), 1000);
        return () => clearInterval(id);
    }, [running]);

    const mm = String(Math.floor(seconds / 60)).padStart(2, "0");
    const ss = String(seconds % 60).padStart(2, "0");
    return <span className={styles["timer"]}>{mm}:{ss}</span>;
}

export default function Chess() {

    const [gameGrid, setGameGrid] = useState<Grid>([]);
    const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([]);
    const [playerTurnColor, setPlayerTurnColor] = useState<"black" | "white">("white");
    const [flipBoard, setFlipBoard] = useState<boolean>(false);
    const [gameId, setGameId] = useState<number>(0);
    const [gameRunning, setGameRunning] = useState<boolean>(false);

    useEffect(() => {
        resetGame();
    }, []);

    useEffect(() => {

        if (gameGrid.length === 0) return;

        if (checkIsMate(gameGrid, playerTurnColor)) {
            alert("CHECKMATE");
            setGameRunning(false);
        }
    }, [gameGrid, playerTurnColor])

    const movePiece = useCallback((grid: Grid, fromX: number, fromY: number, toX: number, toY: number) => {

        let newGrid = applyMove(grid, fromX, fromY, toX, toY);

        // roque: o rei andou 2 casas, então move a torre para o lado dele      
        if (grid[fromY][fromX]!.name === "king" && Math.abs(toX - fromX) === 2) {
            const dir = toX > fromX ? 1 : -1;
            const rookX = dir === 1 ? BOARD_SIZE - 1 : 0;
            newGrid = applyMove(newGrid, rookX, fromY, toX - dir, fromY);
        }

        setGameGrid(newGrid);
        setOverlayElements([]);
        setPlayerTurnColor(prev => prev === "black" ? "white" : "black");

        if (playerTurnColor === "black" && !gameRunning)
            setGameRunning(true);


    }, [playerTurnColor, gameRunning]);

    const resetGame = useCallback(() => {
        setPlayerTurnColor("white");
        setGameGrid(generateGrid());
        setGameId(prev => prev + 1);
        setGameRunning(false);
    }, [])


    const handlePieceClick = useCallback((grid: Grid, x: number, y: number) => {

        const piece = grid[y][x]!;

        if (piece.color !== playerTurnColor) return;

        const result = validMoves[piece.name](grid, x, y);

        const moves = result.moves.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));
        const attacks = result.attacks.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));
        const specials = result.special?.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));

        const overlays: OverlayElement[] = [];

        moves.forEach(([mx, my]) => overlays.push({ type: "move", action: (g) => movePiece(g, x, y, mx, my), x: mx, y: my }));
        attacks.forEach(([mx, my]) => overlays.push({ type: "attack", action: (g) => movePiece(g, x, y, mx, my), x: mx, y: my }));
        if (specials)
            specials.forEach(([mx, my]) => overlays.push({ type: "attack", action: (g) => movePiece(g, x, y, mx, my), x: mx, y: my }));

        setOverlayElements(overlays);

    }, [playerTurnColor])


    return (
        <main className={styles.main}>

            <article className={styles["chess"]}>
                <article className={`${styles["chess-grid"]} ${flipBoard ? styles["flip"] : undefined}`}>
                    {gameGrid.map((row, y) =>
                        row.map((p, x) => {
                            const overlay = overlayElements.find(o => o.x === x && o.y === y);
                            return (
                                <div key={x + (BOARD_SIZE * y)} className={`${styles["tile"]} ${styles[(x + y) % 2 === 0 ? "white" : "black"]}`} onClick={() => setOverlayElements([])}>
                                    <span onClick={(e) => { e.stopPropagation(); handlePieceClick(gameGrid, x, y) }} className={p ? styles[p?.color] : undefined}>{p && piecesNames[p.name][p.color]}</span>
                                    {overlay && <div className={styles[overlay.type]} onClick={(e) => { e.stopPropagation(); overlay.action(gameGrid, x, y) }}></div>}
                                </div>)
                        })
                    )}
                </article>
                <article className={styles["chess-info"]}>
                    <div className={styles["timer-container"]}>
                        <Timer initialTime={300} running={gameRunning && playerTurnColor === "black"} key={gameId} />
                        {playerTurnColor === "black" && <span className={styles["turn"]}>Vez</span>}
                    </div>
                    <div className={styles["infos"]}>
                        <button onClick={() => setFlipBoard(prev => !prev)}>FLIP</button>
                        <button onClick={() => resetGame()}>RESET</button>
                    </div>
                    <div className={styles["timer-container"]}>
                        <Timer initialTime={300} running={gameRunning && playerTurnColor === "white"} key={gameId + 1} />
                        {playerTurnColor === "white" && <span className={styles["turn"]}>Vez</span>}
                    </div>
                </article>
            </article>

        </main>
    )
}