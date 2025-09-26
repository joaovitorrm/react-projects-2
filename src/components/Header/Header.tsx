import Link from "next/link";
import styles from "./Header.module.css";

export default function Header() {
    return (
        <header className={styles.header}>
            <ul>
                <li><Link className={styles["link-label"]} href="/games">Games</Link></li>
                <li><Link className={styles["link-label"]} href="/projects">Projects</Link></li>
                <li><Link className={styles["link-label"]} href="/about">About</Link></li>
            </ul>
        </header>
    )
}