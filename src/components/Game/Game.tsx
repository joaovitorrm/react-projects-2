import Link from "next/link";
import styles from "./Game.module.css";
import Image from "next/image";
import { GameInfo } from "@/types";


export default function Game(props: GameInfo) {

    return (
        <div className={styles.game}>
            <Link href={props.link} className={styles["link-image"]}>
                <Image src={props.loadedImage!} alt="img" fill={true} className={styles.image} />
                <span className={styles.version}>{props.version.toFixed(1)}</span>
            </Link>
            <Link href={props.link} className={styles["link-name"]}>
                <h1>{props.name}</h1>
            </Link>
            <p>{props.description}</p>            
        </div>
    )
}