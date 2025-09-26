import path from "path";
import fs from "fs";
import Link from "next/link";

import styles from "./page.module.css";

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
            <h1>Games</h1>
            <ul>
                {projects.map((project) => (
                    <li key={project.folder}>
                        <Link href={`/games/${project.folder}`}>{project.name}</Link>
                    </li>
                ))}
            </ul>
        </main>
    )
}