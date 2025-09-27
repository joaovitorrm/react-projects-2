import path from "path";
import fs from "fs";

import styles from "./page.module.css";
import Game from "@/components/Game/Game";

export default function Games() {

    const gamesFolder = path.join(process.cwd(), "src", "app", "games");
    const files = fs.readdirSync(gamesFolder);

    const projects = files
        .map((arquivo) => {
            try {
                const data = fs.readFileSync(
                    path.join(gamesFolder, arquivo, "info.json"),
                    "utf-8"
                );
                const info = JSON.parse(data);
                return { ...info, folder: arquivo };
            } catch {
                return null;
            }
        })
        .filter(Boolean);

    return (
        <main className={styles.main}>
            <ul>
                {projects.map((project, index) => (
                    <Game key={index} {...project} />
                ))}
            </ul>
        </main>
    )
}