import path from "path";
import fs from "fs";

import styles from "./page.module.css";
import Game from "@/components/Game/Game";
import PlaceholderImage from "@/assets/util/placeholder.jpg";
import { covers } from "@/assets/covers";
import { GameInfo } from "@/types";

export default async function Games() {

    const gamesFolder = path.join(process.cwd(), "src", "app", "games");
    const folders = fs.readdirSync(gamesFolder).filter((folder) =>
        fs.existsSync(path.join(gamesFolder, folder, "info.ts"))
    );

    const projects = (
        await Promise.all(
            folders.map(async (folder) => {
                try {
                    const info = (await import(`./${folder}/info`)).default as GameInfo;
                    return {
                        ...info,
                        loadedImage: covers[info.imageCoverPath] ?? PlaceholderImage,
                    };
                } catch {
                    return null;
                }
            })
        )
    ).filter(Boolean) as GameInfo[];

    return (
        <main className={styles.main}>
            <section>
                <ul>
                    {projects.sort((a, b) => a.order - b.order).map((project, index) => (
                        <li key={index}>
                            <article>
                                <Game {...project} />
                            </article>
                        </li>
                    ))}
                </ul>
            </section>
        </main>
    )
}