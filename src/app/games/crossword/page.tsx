"use client"

import { act, useEffect, useReducer } from "react";
import styles from "./page.module.css";
import words from "./data.json";

interface ReducerProps {
    gridWidth: number;
    gridHeight: number;
    grid: { text: string[], horizontal: boolean, vertical: boolean }[];
    selected: number;
    selectedDir: number;
    showSelectedDir: boolean
}

const initialState: ReducerProps = {
    gridWidth: 10,
    gridHeight: 12,
    grid: [],
    selected: -1,
    selectedDir: 0,
    showSelectedDir: true
}

type Action =
    { type: "GenerateGrid" } |
    { type: "handleClick", payload: { pos: number } } |
    { type: "handleKeyPress", payload: { pressedKey: string, incrementor: number } } |
    { type: "handleArrowPress", payload: { pressedKey: string } }

function getRandomQuestion(length: keyof typeof words) : {question: string, answer: string} {
    const randomQuestionIndex = Math.floor(Math.random() * words[length].length);
    const question = {question: words[length][randomQuestionIndex][0], answer: words[length][randomQuestionIndex][1]}
    return question;
}

function reducer(state: ReducerProps, action: Action) {
    switch (action.type) {
        case "GenerateGrid": {
            const grid = Array.from({ length: state.gridWidth * state.gridHeight }, () => ({ text: [""], horizontal: false, vertical: false }));

            let { x, y } = { x: Math.floor(Math.random() * (state.gridWidth - 3)), y: Math.floor(Math.random() * (state.gridHeight - 3)) };

            const wordHorizontal = getRandomQuestion((state.gridWidth - x - 1).toString() as keyof typeof words);
            const wordVertical = getRandomQuestion((state.gridHeight - y - 1).toString() as keyof typeof words);

            grid[y * state.gridWidth + x].text = [wordHorizontal.question, wordVertical.question];
            grid[y * state.gridWidth + x].horizontal = true;
            grid[y * state.gridWidth + x].vertical = true;

            return { ...state, grid };
        }

        case "handleClick": {
            if (state.grid[action.payload.pos].horizontal || state.grid[action.payload.pos].vertical) return state;

            if (!state.grid[action.payload.pos + state.gridWidth]) return { ...state, selected: action.payload.pos, selectedDir: 0 }

            if (action.payload.pos % state.gridWidth === state.gridWidth - 1) return { ...state, selected: action.payload.pos, selectedDir: 1 }

            if (action.payload.pos === state.selected) return { ...state, selectedDir: state.selectedDir === 0 ? 1 : 0 }

            return { ...state, selected: action.payload.pos };
        }

        case "handleKeyPress": {
            if (state.selected === -1) return state;

            const updatedGrid = [...state.grid];
            const incrementor = state.selectedDir === 0 ? action.payload.incrementor : action.payload.incrementor * state.gridWidth;
            let selected = state.selected;

            updatedGrid[selected].text = [action.payload.pressedKey];
            selected += incrementor;

            // Checa se posição existe na grid
            if (!updatedGrid[selected]) selected -= incrementor;
            
            // Checa se a nova posição possui uma pergunta
            if (updatedGrid[selected].text.length > 1) selected -= incrementor;

            // 1. Checa se escreveu na borda para não descer
            // 2. Checa se apagou na borda para não subir
            if (state.selectedDir === 0) {
                if (incrementor > 0 && selected % state.gridWidth === 0 ||
                    incrementor < 0 && selected % state.gridWidth === state.gridWidth - 1) {
                    selected -= incrementor;
                }
            }
            

            return { ...state, grid: updatedGrid, selected };
        }

        case "handleArrowPress": {
            let newPos;
            switch (action.payload.pressedKey) {
                case "ArrowDown":
                    if (state.grid[state.selected + state.gridWidth]) newPos = state.selected + state.gridWidth;
                    break;
                case "ArrowUp":
                    if (state.grid[state.selected - state.gridWidth]) newPos = state.selected - state.gridWidth;
                    break;
                case "ArrowRight":
                    if (state.grid[state.selected + 1]) newPos = state.selected + 1;
                    break;
                case "ArrowLeft":
                    if (state.grid[state.selected - 1]) newPos = state.selected - 1;
                    break;
                case "Space":
                    return { ...state, selectedDir: state.selectedDir === 0 ? 1 : 0 }
            }
            if (newPos === undefined || state.grid[newPos].horizontal || state.grid[newPos].vertical) return state;
            return { ...state, selected: newPos }
        }

        default:
            return state;

    }
}


export default function Crosswords() {

    const [state, dispatch] = useReducer(reducer, initialState);

    useEffect(() => {
        dispatch({ type: "GenerateGrid" });

        const handleKeydown = (e: KeyboardEvent) => {
            if (e.key === "Backspace") dispatch({ type: "handleKeyPress", payload: { pressedKey: "", incrementor: -1 } });

            if (["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown", "Space"].includes(e.code)) dispatch({ type: "handleArrowPress", payload: { pressedKey: e.code } })

            if (e.key.length > 1) return;
            const regex = /^[A-ZÇ]+$/;
            if (regex.test(e.key.toUpperCase())) dispatch({ type: "handleKeyPress", payload: { pressedKey: e.key.toUpperCase(), incrementor: 1 } })
        }

        addEventListener("keydown", handleKeydown);

        return () => {
            removeEventListener("keydown", handleKeydown);
        }

    }, []);

    return (
        <main className={styles.main}>

            <section className={styles.grid} style={{ ["--sizeW" as string]: state.gridWidth, ["--sizeH" as string]: state.gridHeight }}>
                {state.grid.map((cell, i) =>
                    <span
                        key={i}
                        onClick={() => dispatch({ type: "handleClick", payload: { pos: i } })}
                        className={[
                            cell.text[0].length > 1 ? styles.question : "",
                            cell.horizontal ? styles.horizontal : "",
                            cell.vertical ? styles.vertical : "",
                            ...i === state.selected ?
                                [styles.selected, state.showSelectedDir ? (state.selectedDir === 0 ? styles.right : styles.down) : ""] : ""
                        ].join(" ").trim()}>
                        {cell.text.length > 1 ? <><p>{cell.text[0]}</p><hr /><p>{cell.text[1]}</p></> : cell.text[0]}
                    </span>
                )}
            </section>

        </main>
    )
}