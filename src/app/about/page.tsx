import styles from "./page.module.css"
import Image from "next/image"
import githubIcon from "@/assets/util/github-icon-white.png"

export default function About() {
    return (
        <main className={styles["main-about"]}>
            <section className={styles["about-section"]}>
                <article className={styles["about-text"]}>
                    Alguns jogos e projetos que desenvolvi utilizando Next/React para me desafiar e me divertir.
                </article>
                <article className={styles["socials"]}>
                    <a href="https://github.com/joaovitorrm" target="_blank">
                        <Image src={githubIcon} alt="github" fill={true} />
                    </a>
                </article>
            </section>
        </main>
    )
}