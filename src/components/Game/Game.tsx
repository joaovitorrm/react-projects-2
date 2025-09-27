import Link from "next/link";
import styles from "./Game.module.css";

interface GameProps {
    name: string,
    description: string,
    imagePath: string,
    version: string,
    link: string
}

export default function Game(props: GameProps) {
    return (
        <div className={styles.game}>
            <Link href={props.link} className={styles["link-image"]}>
                <img src={props.imagePath} alt="img" />
                <span className={styles.version}>{props.version}</span>
            </Link>
            <Link href={props.link} className={styles["link-name"]}>
                <h1>{props.name}</h1>
            </Link>
            <p>{props.description}</p>            
        </div>
    )
}