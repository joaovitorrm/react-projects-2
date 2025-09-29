import path from "path";
import fs from "fs";

import styles from "./page.module.css";
import Game from "@/components/Game/Game";
import PlaceholderImage from "@/assets/util/placeholder.jpg";
import { covers } from "@/assets/covers";

export default function Games() {

    const gamesFolder = path.join(process.cwd(), "src", "app", "games");
    const files = fs.readdirSync(gamesFolder);

    const projects = files
        .map((folder) => {
            try {
                const data = fs.readFileSync(
                    path.join(gamesFolder, folder, "info.json"),
                    "utf-8"
                );
                const info = JSON.parse(data);

                if (!covers[info.image]) {
                    info.image = PlaceholderImage;
                } else {
                    info.image = covers[info.image];
                }

                return { ...info };
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