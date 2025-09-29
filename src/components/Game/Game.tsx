import Link from "next/link";
import styles from "./Game.module.css";
import Image, { StaticImageData } from "next/image";

interface GameProps {
    name: string,
    description: string,
    version: string,
    link: string,
    image: StaticImageData
}

export default function Game(props: GameProps) {
    return (
        <div className={styles.game}>
            <Link href={props.link} className={styles["link-image"]}>
                <Image src={props.image} alt="img" fill={true} className={styles.image} />
                <span className={styles.version}>{props.version}</span>
            </Link>
            <Link href={props.link} className={styles["link-name"]}>
                <h1>{props.name}</h1>
            </Link>
            <p>{props.description}</p>            
        </div>
    )
}