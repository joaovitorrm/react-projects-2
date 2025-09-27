"use client";

import { useEffect, useReducer, useRef } from "react";
import styles from "./page.module.css";


const colors = ["orange", "blue", "green", "red", "yellow", "purple", "pink"];

interface Line {
    start: { x: number, y: number },
    end: { x: number, y: number }
}

interface Drawed {
    word: string,
    line: Line,
    color: string
}

interface State {
    grid: string[][],
    draweds: Drawed[],
    tileSize: number,
    tempLine: Line,
    dragging: boolean
}

type Action =
    { type: "GENERATE_GRID", payload: number } |
    { type: "HANDLE_MOUSE_DOWN", payload: { e: EventTarget, position: { x: number, y: number } } } |
    { type: "HANDLE_MOUSE_UP", payload: { e: EventTarget, position: { x: number, y: number } } } |
    { type: "HANDLE_MOUSE_MOVE", payload: { position: { x: number, y: number } } };

function reducer(state: State, action: Action) {
    switch (action.type) {

        case "HANDLE_MOUSE_DOWN": {

            let size = 0;
            if (state.tileSize === 0) {
                size = (action.payload.e as HTMLCanvasElement).offsetWidth;

                const tempLine = {
                    start: { x: (action.payload.position.x * size + size / 2), y: (action.payload.position.y * size + size / 2) },
                    end: { x: (action.payload.position.x * size + size / 2), y: (action.payload.position.y * size + size / 2) }
                };

                return {
                    ...state, tempLine: tempLine, tileSize: size === 0 ? state.tileSize : size, dragging: true
                };
            }

            const tempLine = {
                start: { x: (action.payload.position.x * state.tileSize + state.tileSize / 2), y: (action.payload.position.y * state.tileSize + state.tileSize / 2) },
                end: { x: (action.payload.position.x * state.tileSize + state.tileSize / 2), y: (action.payload.position.y * state.tileSize + state.tileSize / 2) }
            };

            return {
                ...state, tempLine: tempLine, tileSize: size === 0 ? state.tileSize : size, dragging: true
            };
        }

        case "HANDLE_MOUSE_MOVE": {

            if (state.tempLine.start.x === action.payload.position.x && state.tempLine.start.y === action.payload.position.y) {
                return state;
            }

            return {
                ...state, tempLine: {
                    start: { x: state.tempLine.start.x, y: state.tempLine.start.y },
                    end: { x: action.payload.position.x * state.tileSize + state.tileSize / 2, y: action.payload.position.y * state.tileSize + state.tileSize / 2 }
                }
            };
        }

        case "HANDLE_MOUSE_UP": {

            if (isAligned8Directions(state.tempLine)) {
                const drawed = { word: "", line: state.tempLine, color: colors[Math.floor(Math.random() * colors.length)] };
                return { ...state, draweds: [...state.draweds, drawed], tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }, dragging: false };
            }

            return {
                ...state,
                tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
                dragging: false
            };
        }

        case "GENERATE_GRID": {

            let grid = [];
            for (let y = 0; y < action.payload; y++) {
                grid[y] = [] as string[];
                for (let x = 0; x < action.payload; x++) {
                    const randomLetter = Math.floor(Math.random() * 26) + 65;
                    grid[y].push(String.fromCharCode(randomLetter));
                }
            }

            return { ...state, grid: grid };
        }
        default:
            return state;
    }
}

function drawLine(ctx: CanvasRenderingContext2D, line: Line, color: string = "black", width: number = 15) {
    ctx.globalAlpha = 0.3;
    ctx.lineWidth = width;
    ctx.lineCap = "round";
    ctx.strokeStyle = color;

    ctx.beginPath();
    ctx.moveTo(line.start.x, line.start.y);
    ctx.lineTo(line.end.x, line.end.y);
    ctx.stroke();
}

function isAligned8Directions(line: Line) {
  const dx = line.start.x - line.end.x;
  const dy = line.start.y - line.end.y;

  // linha horizontal
  if (dy === 0 && dx !== 0) return true;

  // linha vertical
  if (dx === 0 && dy !== 0) return true;

  // diagonal perfeita (45°)
  if (Math.abs(dx) === Math.abs(dy) && dx !== 0) return true;

  // não está em nenhuma direção das 8
  return false;
}

export default function Crosswords() {

    let gridSize = 10;
    const [state, dispatch] = useReducer(reducer, { grid: [], draweds: [], tileSize: 0, tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }, dragging: false });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const crosswordsRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        if (state.grid.length === 0) {
            dispatch({ type: "GENERATE_GRID", payload: gridSize });
        }
    }, []);

    useEffect(() => {
        if (crosswordsRef.current && canvasRef.current) {
            canvasRef.current.width = crosswordsRef.current.offsetWidth;
            canvasRef.current.height = crosswordsRef.current.offsetHeight;
            contextRef.current = canvasRef.current.getContext("2d");
        }
    }, [crosswordsRef.current]);

    useEffect(() => {
        if (!contextRef.current || !canvasRef.current) return;

        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        for (const d of state.draweds) {
            drawLine(contextRef.current, d.line, d.color);
        }

        if (state.tempLine.start.x !== 0 && state.tempLine.start.y !== 0 && state.dragging) {
            drawLine(contextRef.current, state.tempLine);
        }

    }, [state.draweds, state.tempLine]);

    return (
        <main className={styles.main}>
            <div className={styles.crosswords} style={{ ["--size" as string]: gridSize }} ref={crosswordsRef}>
                {state.grid.map((row, y) => (
                    row.map((letter, x) => (
                        <span
                            key={x + "-" + y}
                            onMouseDown={(e) =>
                                dispatch({
                                    type: "HANDLE_MOUSE_DOWN",
                                    payload: {
                                        e: e.target,
                                        position: { x, y }
                                    }
                                })
                            }
                            onMouseUp={(e) =>
                                dispatch({
                                    type: "HANDLE_MOUSE_UP",
                                    payload: {
                                        e: e.target,
                                        position: { x, y }
                                    }
                                })
                            }
                            onMouseEnter={() =>
                                dispatch({
                                    type: "HANDLE_MOUSE_MOVE",
                                    payload: {
                                        position: { x, y }
                                    }
                                })
                            }
                        >
                            {letter}
                        </span>
                    ))
                ))}
                <canvas ref={canvasRef} className={styles.canvas}></canvas>
            </div>
        </main>
    )
}