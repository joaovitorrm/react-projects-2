"use client"

import { useCallback, useEffect, useState } from "react"
import styles from "./page.module.css"

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
    return (x < 0 || x > 7 || y < 0 || y > 7);
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
    attacks: [number, number][]
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

        return { moves, attacks };
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

        return { moves, attacks };
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

type OverlayElement = {
    type: "move" | "attack",
    action: (grid: Grid, x: number, y: number) => void,
    x: number,
    y: number,
}

export default function Chess() {

    const BOARD_SIZE = 8;
    const [gameGrid, setGameGrid] = useState<Grid>([]);
    const [overlayElements, setOverlayElements] = useState<OverlayElement[]>([]);
    const [playerTurnColor, setPlayerTurnColor] = useState<"black" | "white">("white");

    const generateGrid = useCallback(() => {
        const createdGrid = Array.from({ length: BOARD_SIZE }, () => new Array<Piece | null>(BOARD_SIZE).fill(null));

        piecesStartPatternBlack.forEach((p, i) => {
            createdGrid[Math.floor(i / BOARD_SIZE)][i - Math.floor(i / BOARD_SIZE) * BOARD_SIZE] = { color: "black", name: p, hasMoved: false };
        })

        piecesStartPatternWhite.forEach((p, i) => {
            createdGrid[Math.floor(i / BOARD_SIZE + BOARD_SIZE - 2)][i - Math.floor(i / BOARD_SIZE) * BOARD_SIZE] = { color: "white", name: p, hasMoved: false };
        })

        setGameGrid(createdGrid);
    }, []);

    useEffect(() => {
        generateGrid();
    }, []);

    /* useEffect(() => {
        if (!gameGrid || gameGrid.length === 0) return;
        //console.log(validMoves["pawn"](gameGrid, 0, 2))
    }, [gameGrid]) */

    const movePiece = useCallback((grid: Grid, fromX: number, fromY: number, toX: number, toY: number) => {
        setGameGrid(applyMove(grid, fromX, fromY, toX, toY));
        setOverlayElements([]);
        setPlayerTurnColor(prev => prev === "black" ? "white" : "black");

    }, [playerTurnColor]);

    const handlePieceClick = useCallback((grid: Grid, x: number, y: number) => {

        const piece = grid[y][x]!;

        if (piece.color !== playerTurnColor) return;

        const result = validMoves[piece.name](grid, x, y);

        const moves = result.moves.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));
        const attacks = result.attacks.filter(([mx, my]) => !wouldBeInCheck(grid, x, y, mx, my));

        const overlays: OverlayElement[] = [];

        moves.forEach(([mx, my]) => overlays.push({ type: "move", action: (g) => movePiece(g, x, y, mx, my), x: mx, y: my }));
        attacks.forEach(([mx, my]) => overlays.push({ type: "attack", action: (g) => movePiece(g, x, y, mx, my), x: mx, y: my }));

        setOverlayElements(overlays);

    }, [playerTurnColor])


    return (
        <main className={styles.main}>

            <article className={styles["chess"]}>
                <article className={styles["chess-grid"]}>
                    {gameGrid.map((row, y) =>
                        row.map((p, x) => {
                            const overlay = overlayElements.find(o => o.x === x && o.y === y);
                            return (
                                <div key={x + (BOARD_SIZE * y)} className={`${styles["tile"]} ${styles[(x + y) % 2 === 0 ? "white" : "black"]}`} onClick={() => setOverlayElements([])}>
                                    <span onClick={(e) => { e.stopPropagation(); handlePieceClick(gameGrid, x, y) }}>{p && piecesNames[p.name][p.color]}</span>
                                    {overlay && <div className={styles[overlay.type]} onClick={(e) => { e.stopPropagation(); overlay.action(gameGrid, x, y) }}></div>}
                                </div>)
                        })
                    )}
                </article>
            </article>

        </main>
    )
}