"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import styles from "./page.module.css";
import palavrasJSON from "./palavras.json";
import { useTimer } from "@/hooks/useTimer";

// PRE-SELECTED COLORS
const colors = [
    "hsl(0, 100%, 50%)",
    "hsl(25, 100%, 50%)",
    "hsl(50, 100%, 50%)",
    "hsl(100, 100%, 50%)",
    "hsl(180, 100%, 50%)",
    "hsl(220, 100%, 50%)",
    "hsl(260, 100%, 50%)",
];

// DIRECTIONS PATH 
const directionsPath = {
    up: { x: 0, y: -1 },
    down: { x: 0, y: 1 },
    left: { x: -1, y: 0 },
    right: { x: 1, y: 0 },
    upRight: { x: 1, y: -1 },
    downRight: { x: 1, y: 1 },
    downLeft: { x: -1, y: 1 },
    upLeft: { x: -1, y: -1 }
}

type ColorType =
    { type: "selector", color: string } |
    { type: "option", color: string } |
    { type: "rainbow", color: string };


interface Line {
    start: { x: number, y: number },
    end: { x: number, y: number }
}

interface Drawed {
    word: string,
    line: Line,
    color: ColorType
}

interface State {
    grid: string[][],
    draweds: Drawed[],
    tileSize: number,
    tempLine: Line,
    dragging: boolean,
    words: string[],
    ended: boolean
}

type Action =
    { type: "GENERATE_GRID", payload: { size: number } } |
    { type: "HANDLE_MOUSE_DOWN", payload: { position: { x: number, y: number } } } |
    { type: "HANDLE_MOUSE_UP", payload: { position: { x: number, y: number }, color: ColorType } } |
    { type: "HANDLE_MOUSE_MOVE", payload: { position: { x: number, y: number } } } |
    { type: "SET_TILE_SIZE", payload: { size: number } } |
    { type: "RESTART" } |
    { type: "SET_END_GAME", payload: boolean };

function reducer(state: State, action: Action) {
    switch (action.type) {

        case "SET_TILE_SIZE": return { ...state, tileSize: action.payload.size };

        case "SET_END_GAME": return { ...state, ended: action.payload };

        case "RESTART": {
            return {
                ...state,
                grid: [],
                draweds: [],
                tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
                dragging: false,
                words: [],
                ended: false
            };
        }

        case "HANDLE_MOUSE_DOWN": {
            const tempLine = {
                start: { x: (action.payload.position.x), y: (action.payload.position.y) },
                end: { x: (action.payload.position.x), y: (action.payload.position.y) }
            };

            return {
                ...state, tempLine: tempLine, dragging: true
            };
        }

        case "HANDLE_MOUSE_MOVE": {

            if (!state.dragging) {
                return state;
            }

            return {
                ...state, tempLine: {
                    start: { x: state.tempLine.start.x, y: state.tempLine.start.y },
                    end: { x: action.payload.position.x, y: action.payload.position.y }
                }
            };
        }

        case "HANDLE_MOUSE_UP": {

            if (!isAligned8Directions(state.tempLine)) {
                return {
                    ...state,
                    tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
                    dragging: false
                };
            }

            const dx = state.tempLine.end.x - state.tempLine.start.x;
            const dy = state.tempLine.end.y - state.tempLine.start.y;

            const horizontalDir = Math.sign(dx); // -1 0 ou 1
            const verticalDir = Math.sign(dy); // -1 0 ou 1

            // GET THE WORD FROM THE TEMP LINE
            const word = Array.from({ length: (Math.max(Math.abs(dx), Math.abs(dy)) + 1) }, (_, i) =>
                state.grid[state.tempLine.start.y + verticalDir * i][state.tempLine.start.x + horizontalDir * i]
            ).join("");

            // CHECK IF THE WORD EXISTS IN THE CREATED WORDS LIST
            if (!state.words.includes(word)) return {
                ...state,
                tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
                dragging: false
            };


            // GET THE COLOR
            const newColor: ColorType = { ...action.payload.color };

            // CHECK IF THE COLOR IS RAINBOW THEN GET A RANDOM COLOR
            if (newColor.type === "rainbow") {
                const r = Math.floor(Math.random() * 256);
                const g = Math.floor(Math.random() * 256);
                const b = Math.floor(Math.random() * 256);
                newColor.color = `rgb(${r}, ${g}, ${b})`;
            }

            // CHECK IF THE WORD IS ALREADY DRAWED THEN JUST CHANGE THE COLOR
            const drawedsCopy = [...state.draweds];
            const found = drawedsCopy.find(drawed => drawed.word === word);

            if (found) {
                found.color.color = newColor.color;
                return {
                    ...state,
                    tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
                    dragging: false,
                    draweds: drawedsCopy
                };
            }

            // SETS THE LINE TO BE DRAWED
            const drawedLine: Line = {
                start: {
                    x: state.tempLine.start.x * state.tileSize + state.tileSize / 2,
                    y: state.tempLine.start.y * state.tileSize + state.tileSize / 2
                },
                end: {
                    x: state.tempLine.end.x * state.tileSize + state.tileSize / 2,
                    y: state.tempLine.end.y * state.tileSize + state.tileSize / 2
                }
            };

            const drawed = { word: word, line: drawedLine, color: newColor };
            return { ...state, draweds: [...state.draweds, drawed], tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } }, dragging: false };
        }

        case "GENERATE_GRID": {

            // CREATEAS AND EMPTY GRID WITH ""
            const grid = Array.from({ length: action.payload.size }, () => Array.from({ length: action.payload.size }, () => ""));

            // AMOUNT OF WORDS THAT WILL TRY TO BE PLACED
            const wordsAmount = 20;

            // GET ALL THE WORDS AND CREATES A COPY
            const words = [...palavrasJSON.palavras] as string[];

            const usedWords = [] as string[];

            for (let i = 0; i < wordsAmount; i++) {
                // GET A RANDOM WORD
                const randomWord = words.splice(Math.floor(Math.random() * words.length), 1)[0];

                // CHECK IF THE WORD IS BIGGER THAN THE GRID
                if (randomWord.length > action.payload.size) continue;

                const places = {} as { [key: string]: boolean };

                // TRYES TO GET A RANDOM POSITION FOR THE WORD 10 TIMES
                for (let c = 0; c < wordsAmount * 15; c++) {
                    // WILL BE TRUE IF THE WORD CAN BE PLACED IN THAT DIRECTION
                    const directions = {
                        up: false,
                        down: false,
                        left: false,
                        right: false,
                        upRight: false,
                        downRight: false,
                        downLeft: false,
                        upLeft: false
                    }

                    let x = 0, y = 0;
                    // GET A RANDOM POSITION AND CHECKS IF IT IS ALREADY USED, TRYS 10 TIMES
                    for (let j = 0; j < 10; j++) {
                        x = Math.floor(Math.random() * action.payload.size);
                        y = Math.floor(Math.random() * action.payload.size);
                        if (!places[`${x}-${y}`]) break;
                    }
                    places[`${x}-${y}`] = true;

                    // CHECK ALL THE DIRECTIONS
                    if (x + randomWord.length <= action.payload.size) directions.right = true;
                    if (y + randomWord.length <= action.payload.size) directions.down = true;
                    if (y - randomWord.length >= 0) directions.up = true;
                    if (x - randomWord.length >= 0) directions.left = true;

                    if (directions.up && directions.right) {
                        directions.upRight = true;
                        // JUST TO MAKE IT HARDER, REMOVE THE DIRECTION 50% OF THE TIME
                        if (Math.floor(Math.random() * 2) === 1) {
                            directions.right = false;
                            directions.up = false;
                        };
                    };
                    if (directions.down && directions.right) {
                        directions.downRight = true;
                        if (Math.floor(Math.random() * 2) === 1) {
                            directions.down = false;
                            directions.right = false;
                        };
                    }

                    if (directions.down && directions.left) {
                        directions.downLeft = true;
                        if (Math.floor(Math.random() * 2) === 1) {
                            directions.down = false;
                            directions.left = false;
                        }
                    };
                    if (directions.up && directions.left) {
                        directions.upLeft = true;
                        if (Math.floor(Math.random() * 2) === 1) {
                            directions.up = false;
                            directions.left = false;
                        }
                    };

                    // REMOVE ALL THE DIRECTIONS THAT CAN'T BE USED
                    for (const direction in directions) {
                        const dir = direction as keyof typeof directions;
                        if (!directions[dir]) {
                            delete directions[dir];
                            continue;
                        }

                        for (let k = 0; k < randomWord.length; k++) {
                            if (grid[y + directionsPath[dir].y * k][x + directionsPath[dir].x * k] !== "" &&
                                grid[y + directionsPath[dir].y * k][x + directionsPath[dir].x * k] !== randomWord[k]) {
                                delete directions[dir];
                                continue;
                            }
                        }
                    }
                    // IF THERE IS A DIRECTION THAT CAN BE USED, CHOSE RANDOMLY AND USE IT
                    if (Object.keys(directions).length > 0) {
                        const randomDir = Object.keys(directions)[Math.floor(Math.random() * Object.keys(directions).length)];
                        for (let k = 0; k < randomWord.length; k++) {
                            grid[y + directionsPath[randomDir as keyof typeof directionsPath].y * k][x + directionsPath[randomDir as keyof typeof directionsPath].x * k] = randomWord[k];
                        }
                        usedWords.push(randomWord);
                        break;
                    }
                }
            }

            // FILL THE REST OF THE GRID
            for (let y = 0; y < action.payload.size; y++) {
                for (let x = 0; x < action.payload.size; x++) {
                    if (grid[y][x] !== "") continue;
                    const randomLetter = Math.floor(Math.random() * 26) + 65;
                    grid[y][x] = String.fromCharCode(randomLetter);
                }
            }

            return { ...state, grid: grid, words: usedWords.sort() };
        }
        default:
            return state;
    }
}

function drawLine(ctx: CanvasRenderingContext2D, line: Line, color: string = "black") {
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

    const gridSize = 11;
    const [state, dispatch] = useReducer(reducer,
        {
            grid: [],
            draweds: [],
            tileSize: 0,
            tempLine: { start: { x: 0, y: 0 }, end: { x: 0, y: 0 } },
            dragging: false,
            words: [],
            ended: false
        });

    const canvasRef = useRef<HTMLCanvasElement | null>(null);
    const contextRef = useRef<CanvasRenderingContext2D | null>(null);
    const crosswordsRef = useRef<HTMLDivElement | null>(null);

    const [color, setColor] = useState<ColorType>({ type: "selector", color: "red" });
    const timer = useTimer();

    useEffect(() => {
        if (state.grid.length === 0) {
            dispatch({ type: "GENERATE_GRID", payload: { size: gridSize } });
            timer.reset();
            timer.start();
        }
    }, [state.grid.length]);

    useEffect(() => {
        if (crosswordsRef.current && canvasRef.current) {
            canvasRef.current.width = crosswordsRef.current.offsetWidth;
            canvasRef.current.height = crosswordsRef.current.offsetHeight;
            contextRef.current = canvasRef.current.getContext("2d");

            const ctx = contextRef.current!;
            ctx.globalAlpha = 0.3;
            ctx.lineWidth = 15;
            ctx.lineCap = "round";

            const size = canvasRef.current.offsetWidth / gridSize;
            dispatch({ type: "SET_TILE_SIZE", payload: { size } });
        }
    }, []);

    useEffect(() => {
        if (!contextRef.current || !canvasRef.current) return;

        contextRef.current.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);

        for (const d of state.draweds) {
            drawLine(contextRef.current, d.line, d.color.color);
        }

        if (state.grid.length > 0 && state.draweds.length >= state.words.length) {
            dispatch({ type: "SET_END_GAME", payload: true });
            timer.pause();
        }

        if (state.dragging) {
            const linePos: Line = {
                start: {
                    x: state.tempLine.start.x * state.tileSize + state.tileSize / 2,
                    y: state.tempLine.start.y * state.tileSize + state.tileSize / 2
                },
                end: {
                    x: state.tempLine.end.x * state.tileSize + state.tileSize / 2,
                    y: state.tempLine.end.y * state.tileSize + state.tileSize / 2
                }
            };
            drawLine(contextRef.current, linePos);
        }

    }, [state.draweds, state.tempLine, state.words]);

    useEffect(() => {
        const div = crosswordsRef.current;
        if (!div) return;

        const handleTouch = (type: "start" | "move" | "end", e: TouchEvent) => {
            const touch = type === "end" ? e.changedTouches[0] : e.touches[0];
            const rect = div.getBoundingClientRect();
            let x = Math.floor((touch.clientX - rect.left) / state.tileSize);
            if (x > gridSize - 1) x = gridSize - 1;
            if (x < 0) x = 0;
            let y = Math.floor((touch.clientY - rect.top) / state.tileSize);
            if (y > gridSize - 1) y = gridSize - 1;
            if (y < 0) y = 0;

            e.preventDefault();

            if (type === "start") dispatch({ type: "HANDLE_MOUSE_DOWN", payload: { position: { x, y } } });
            if (type === "move") dispatch({ type: "HANDLE_MOUSE_MOVE", payload: { position: { x, y } } });
            if (type === "end") dispatch({ type: "HANDLE_MOUSE_UP", payload: { position: { x, y }, color } });
        };

        const handleTouchStart = (e: TouchEvent) => handleTouch("start", e);
        const handleTouchMove = (e: TouchEvent) => handleTouch("move", e);
        const handleTouchEnd = (e: TouchEvent) => handleTouch("end", e);

        div.addEventListener("touchstart", handleTouchStart);
        div.addEventListener("touchmove", handleTouchMove, { passive: false });
        div.addEventListener("touchend", handleTouchEnd);

        return () => {
            div.removeEventListener("touchstart", handleTouchStart);
            div.removeEventListener("touchmove", handleTouchMove);
            div.removeEventListener("touchend", handleTouchEnd);
        };
    }, [state.tileSize, color]);

    return (
        <main className={styles.main}>
            <div className={styles["color-picker"]}>
                <input
                    type="color"
                    className={color.type === "selector" ? styles.selected : ""}
                    defaultValue={"#ff0000"}
                    onChange={(e) => setColor({ type: "selector", color: e.target.value })} />
                {colors.map((colorHSL, i) => (
                    <input
                        key={i}
                        className={`${styles["color-picker-option"]} ${color.type === "option" && color.color === colorHSL ? styles.selected : ""}`}
                        style={{ ["--color" as string]: colorHSL }}
                        type="button"
                        onClick={() => setColor({ type: "option", color: colorHSL })}
                    />
                ))}
                <input
                    className={`${styles["color-picker-option"]} ${styles.rainbow} ${color.type === "rainbow" ? styles.selected : ""}`}
                    type="button"
                    onClick={() => setColor({ type: "rainbow", color: "rainbow" })}
                />
            </div>
            <div className={styles.crosswords} style={{ ["--size" as string]: gridSize }} ref={crosswordsRef}>
                {state.grid.map((row, y) => (
                    row.map((letter, x) => (
                        <span
                            key={x + "-" + y}
                            onMouseDown={() =>
                                dispatch({
                                    type: "HANDLE_MOUSE_DOWN",
                                    payload: {
                                        position: { x, y }
                                    }
                                })
                            }
                            onMouseUp={() =>
                                dispatch({
                                    type: "HANDLE_MOUSE_UP",
                                    payload: {
                                        position: { x, y },
                                        color: color
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
                <div className={`${styles["end-screen"]} ${state.ended ? styles.active : ""}`}>
                    <h2>FIM DE JOGO!</h2>
                    <p>Parabéns, você encontrou todas as palavras em <b className={styles.time}>{timer.time(false)}</b></p>
                    <input type="button" value={"REINICIAR"} onClick={() => dispatch({ type: "RESTART" })} />
                </div>
            </div>
            <div className={styles.words}>
                {state.words.map((word, index) => (
                    <span key={index} className={state.draweds.find(d => d.word.toUpperCase() === word.toUpperCase()) ? styles.inactive : styles.active}>{word}</span>
                ))}
            </div>
        </main>
    )
}