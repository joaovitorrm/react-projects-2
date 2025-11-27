import { StaticImageData } from "next/image";
import wordSearchCover from "./wordSearch-cover.png";
import nonogramCover from "./nonogram-cover.png";

export const covers: Record<string, StaticImageData> = {
    "wordSearch": wordSearchCover,
    "nonogram": nonogramCover
}