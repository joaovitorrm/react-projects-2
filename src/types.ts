import { StaticImageData } from "next/image"

export interface GameInfo {
    name: string,
    description: string,
    version: number,
    imageCoverPath: CoverKeys,
    loadedImage: StaticImageData | null;
    link: string,
    order: number
}

type CoverKeys = "wordSearch" | "nonogram" | "chess";
export type Covers = Record<CoverKeys, StaticImageData | null>;