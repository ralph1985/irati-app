import { iratiProfile } from "@/modules/profile/domain/baby-profile";
import Link from "next/link";
import styles from "./page.module.css";

export default function Home() {
  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <p className={styles.kicker}>App privada familiar</p>
          <h1 id="home-title">{iratiProfile.name}</h1>
          <p className={styles.birthDate}>Nacida el 2 de julio de 2026</p>
        </section>

        <section className={styles.summary} aria-label="Resumen inicial">
          <article>
            <span>Peso</span>
            <strong>Sin registros</strong>
          </article>
          <article>
            <span>Vacunas</span>
            <strong>Calendario pendiente</strong>
          </article>
        </section>
      </main>

      <nav className={styles.nav} aria-label="Navegacion principal">
        <Link aria-current="page" href="/">
          Inicio
        </Link>
        <Link href="/peso">Peso</Link>
        <Link href="/vacunas">Vacunas</Link>
        <Link href="/ajustes">Ajustes</Link>
      </nav>
    </div>
  );
}
