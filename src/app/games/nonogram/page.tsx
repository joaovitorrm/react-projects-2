"use client"

import { useEffect, useReducer, useState } from "react";
import styles from "./page.module.css";
import Image from "next/image";
import Heart from "@/assets/util/heart.png";
import Settings from "@/assets/util/setting_2.png";
import Hint from "@/assets/util/light-bulb.png";
import { useTimer } from "@/hooks/useTimer";

type DrawType =
    "FILL" | "X" | "CONTINUE";

type Difficulties = { Difficulty: "Easy", value: 0.3 } | { Difficulty: "Medium", value: 0.5 } | { Difficulty: "Hard", value: 0.7 };

type Action =
    { type: "SET_GRID_SIZE", payload: { size: number } } |
    { type: "SET_DIFFICULTY", payload: { difficulty: Difficulties } } |
    { type: "USE_HINT" } |
    { type: "GENERATE_GRID" } |
    { type: "HANDLE_MOUSE_DOWN", payload: { index: number, type: DrawType } } |
    { type: "HANDLE_MOUSE_UP" };

interface LineHint {
    arr: number[],
    completed: boolean
}

interface ReducerProps {
    gridSize: number,
    grid: number[],
    drawed: number[],
    isDrawing: boolean,
    hints: { horizontal: LineHint[], vertical: LineHint[] },
    type: DrawType,
    lives: number,
    ended: boolean,
    difficulty: Difficulties,
    hintsAmount: number
}

function reducer(state: ReducerProps, action: Action) {
    switch (action.type) {

        case "SET_DIFFICULTY": return action.payload.difficulty === state.difficulty ? state : { ...state, difficulty: action.payload.difficulty };

        case "SET_GRID_SIZE": return action.payload.size === state.gridSize ? state : { ...state, gridSize: action.payload.size };

        case "USE_HINT": {
            if (state.ended || state.hintsAmount === 0) return state;

            let hintIndex = -1;
            const prevIndex = [];
            while (true) {
                let index;
                do {
                    index = Math.floor(Math.random() * state.grid.length);
                } while (prevIndex[index] === 1);

                if (state.grid[index] === 1 && state.drawed[index] != 1) {
                    hintIndex = index;
                    break;
                }
                prevIndex[index] = 1;
            };

            const draweds = [...state.drawed];
            draweds[hintIndex] = 1;

            if (state.grid.every((v, i) => {
                if (v !== 1) return true;
                return draweds[i] === 1;
            })) {
                return { ...state, ended: true, isDrawing: false, drawed: draweds, hintsAmount: state.hintsAmount - 1 };
            }

            return { ...state, drawed: draweds, hintsAmount: state.hintsAmount - 1 };
        }

        case "GENERATE_GRID": {
            const grid = [];
            for (let i = 0; i < state.gridSize * state.gridSize; i++) {
                grid.push(Math.sign(Math.random() - state.difficulty.value));
            }

            const rows: LineHint[] = [];
            const columns: LineHint[] = [];
            for (let i = 0; i < state.gridSize; i++) {
                const row = [];
                const column = [];
                let hintValRow = 0;
                let hintValColumn = 0;
                for (let j = 0; j < state.gridSize; j++) {
                    if (grid[i * state.gridSize + j] === 1) {
                        hintValRow++;
                    } else if (hintValRow > 0) {
                        row.push(hintValRow);
                        hintValRow = 0;
                    }
                    if (j === state.gridSize - 1 && hintValRow > 0) {
                        row.push(hintValRow);
                    }

                    if (grid[j * state.gridSize + i] === 1) {
                        hintValColumn++;
                    } else if (hintValColumn > 0) {
                        column.push(hintValColumn);
                        hintValColumn = 0;
                    }
                    if (j === state.gridSize - 1 && hintValColumn > 0) {
                        column.push(hintValColumn);
                    }
                }
                rows.push({ arr: row, completed: false });
                columns.push({ arr: column, completed: false });
            }

            return { ...state, grid, hints: { horizontal: rows, vertical: columns }, ended: false, drawed: [], lives: 3, hintsAmount: 5 };
        }

        case "HANDLE_MOUSE_DOWN": {
            const drawed = [...state.drawed];

            const type = action.payload.type === "CONTINUE" ? state.type : action.payload.type;
            let lives = state.lives;

            if (type === "FILL") {
                if (state.grid[action.payload.index] === 1) {
                    drawed[action.payload.index] = 1;
                } else if (state.grid[action.payload.index] === -1 && drawed[action.payload.index] !== -1) {
                    drawed[action.payload.index] = -2;
                    lives--;
                }

                if (state.grid.every((v, i) => {
                    if (v !== 1) return true;
                    return drawed[i] === 1;
                })) {
                    return { ...state, ended: true, isDrawing: false, drawed, type: type };
                }

            } else {
                if (drawed[action.payload.index] === -1) {
                    drawed[action.payload.index] = 0;
                } else if (!drawed[action.payload.index] || drawed[action.payload.index] === 0) {
                    drawed[action.payload.index] = -1;
                } else {
                    return state;
                }
            }
            return { ...state, drawed, isDrawing: true, type: type, lives, ended: lives === 0 ? true : false };
        }

        case "HANDLE_MOUSE_UP": {
            return { ...state, isDrawing: false };
        }


        default:
            return state;
    }
}

export default function Nonogram() {

    const [state, dispatch] = useReducer(reducer, {
        gridSize: 10,
        grid: [],
        drawed: [],
        isDrawing: false,
        hints: {
            horizontal: [] as LineHint[],
            vertical: [] as LineHint[]
        },
        type: "FILL",
        lives: 3,
        ended: false,
        difficulty: { Difficulty: "Medium", value: 0.5 },
        hintsAmount: 5
    });

    const [type, setType] = useState<DrawType>("FILL");
    const timer = useTimer();
    const [showSettings, setShowSettings] = useState(false);

    useEffect(() => {
        dispatch({ type: "GENERATE_GRID" });
    }, []);

    useEffect(() => {
        if (state.ended) timer.pause();
    }, [state.ended]);

    useEffect(() => {
        timer.reset();
        timer.start();
    }, [state.grid])

    return (
        <main className={styles.main}>
            <article className={styles["nonogram-container"]} style={{ ["--size" as string]: Math.sqrt(state.grid.length) }}>
                <aside className={styles["horizontal-hints"]}>
                    {state.hints.horizontal.map((hint, index) =>
                        <div key={index} className={styles["hint-container"]}>
                            {hint.arr.map((val, index) => <span key={index} className={styles.hint}>{val}</span>)}
                        </div>
                    )}
                </aside>
                <aside className={styles["vertical-hints"]}>
                    {state.hints.vertical.map((hint, index) =>
                        <div key={index} className={styles["hint-container"]}>
                            {hint.arr.map((val, index) => <span key={index} className={styles.hint}>{val}</span>)}
                        </div>
                    )}
                </aside>
                <section className={styles.nonogram} onMouseOut={() => dispatch({ type: "HANDLE_MOUSE_UP" })}>
                    {state.grid.map((val, index) =>
                        <span
                            key={index}
                            className={state.drawed[index] === -2 ? styles.wrong :
                                state.drawed[index] === -1 ? styles.clear :
                                    (val === 1 && state.drawed[index] === 1) ? styles.filled :
                                        styles.empty}
                            onMouseDown={(e) => {
                                if (e.button === 0) {
                                    dispatch({ type: "HANDLE_MOUSE_DOWN", payload: { index, type } })
                                } else {
                                    setType((prev) => prev === "FILL" ? "X" : "FILL");
                                }
                            }}
                            onMouseEnter={() => state.isDrawing && dispatch({ type: "HANDLE_MOUSE_DOWN", payload: { index, type: "CONTINUE" } })}
                            onMouseUp={() => dispatch({ type: "HANDLE_MOUSE_UP" })}
                            onContextMenu={(e) => e.preventDefault()}
                        >
                            {(state.drawed[index] === -1 || state.drawed[index] === -2) ? "X" : ""}
                        </span>)}
                </section>
                <section className={styles["btns-container"]}>
                    <div className={styles["heart-container"]}>
                        <span className={styles["heart-icon"]}>
                            <Image src={Heart} alt="img" fill={true} className={styles.img} draggable={false} />
                        </span>
                        {state.lives}
                    </div>
                    <label className={styles["type-container"]}>
                        <input type="checkbox" id="fill" name="type" checked={type === "FILL"} onChange={(e) => setType(e.target.checked ? "FILL" : "X")} />
                        <span className={styles.slider}></span>
                        <span className={styles["x-icon"]}>X</span>
                        <span className={styles["fill-icon"]}></span>
                    </label>
                    <div className={styles["settings-icon-container"]} onClick={() => state.ended ? {} : setShowSettings(prev => !prev)}>
                        <span className={styles["settings-icon"]}>
                            <Image src={Settings} alt="img" fill={true} className={styles.img} draggable={false} />
                        </span>
                    </div>
                    <div className={styles["hint-container"]} onClick={() => state.ended ? {} : dispatch({ type: "USE_HINT" })}>
                        <span className={styles["hint-icon"]}>
                            <Image src={Hint} alt="img" fill={true} className={styles.img} draggable={false} />
                        </span>
                        <span className={styles.amount}>{state.hintsAmount}</span>
                    </div>
                </section>
                <section className={`${styles["settings-container"]} ${showSettings ? styles.active : ""}`}>
                    <h2>CONFIGURAÇÕES</h2>

                    <div className={styles["option-container"]}>
                        <label htmlFor="size">Tamanho da Grid</label>
                        <ul>
                            {["5x5", "10x10", "15x15"].map((val, index) =>
                                <li key={index}>
                                    <button
                                        className={state.gridSize === ((index + 1) * 5) ? styles.active : ""}
                                        onClick={() => dispatch({ type: "SET_GRID_SIZE", payload: { size: (index + 1) * 5 } })}
                                    >{val}</button>
                                </li>)}
                        </ul>
                    </div>

                    <div className={styles["option-container"]}>
                        <label htmlFor="difficult">Dificuldade</label>
                        <ul>
                            <li><button className={state.difficulty.Difficulty === "Easy" ? styles.active : ""}
                                onClick={() => dispatch({ type: "SET_DIFFICULTY", payload: { difficulty: { Difficulty: "Easy", value: 0.3 } } })}>Fácil</button></li>
                            <li><button className={state.difficulty.Difficulty === "Medium" ? styles.active : ""}
                                onClick={() => dispatch({ type: "SET_DIFFICULTY", payload: { difficulty: { Difficulty: "Medium", value: 0.5 } } })}>Normal</button></li>
                            <li><button className={state.difficulty.Difficulty === "Hard" ? styles.active : ""}
                                onClick={() => dispatch({ type: "SET_DIFFICULTY", payload: { difficulty: { Difficulty: "Hard", value: 0.7 } } })}>Difícil</button></li>
                        </ul>
                    </div>

                    <div className={styles["reset-btn-container"]}>
                        <button className={styles["reset-btn"]} onClick={() => dispatch({ type: "GENERATE_GRID" })}>RECOMEÇAR</button>
                    </div>

                </section>
                <section className={`${styles["end-container"]} ${state.ended ? styles.active : ""}`}>
                    {state.lives === 0 ?
                        <div className={styles.end}>
                            <h1>FIM DE JOGO!</h1>
                            <p>Não foi dessa vez! Tente novamente</p>
                            <button onClick={() => dispatch({ type: "GENERATE_GRID" })}>Tentar Novamente</button>
                        </div> :
                        <div className={styles.end}>
                            <h1>VOCÊ GANHOU!</h1>
                            <p>Você conseguiu resolver o Nonogram! em <b>{timer.time(false)}</b></p>
                            <button onClick={() => dispatch({ type: "GENERATE_GRID" })}>Jogar Novamente</button>
                        </div>}
                </section>
            </article>
        </main>
    )
}