"use client";

import Link from "next/link";
import styles from "./Header.module.css";
import { usePathname } from "next/navigation";

export default function Header() {

    const pathName = usePathname();

    return (
        <header className={styles.header}>
            <ul>
                <li><Link className={`${styles["label"]} ${pathName === "/games" ? styles.active : ""}`} href="/games">Jogos</Link></li>
                <li><Link className={`${styles["label"]} ${pathName === "/projects" ? styles.active : ""}`} href="/projects">Projetos</Link></li>
                <li><Link className={`${styles["label"]} ${pathName === "/about" ? styles.active : ""}`} href="/about">Sobre</Link></li>
            </ul>
        </header>
    )
}