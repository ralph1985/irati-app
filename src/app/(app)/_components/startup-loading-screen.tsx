import styles from "./startup-loading-screen.module.css";

export function StartupLoadingScreen() {
  return (
    <main className={styles.screen} aria-labelledby="startup-loading-title">
      <section className={styles.panel} aria-busy="true" aria-live="polite">
        <div className={styles.brand}>
          <span aria-hidden="true" className={styles.brandMark}>
            I
          </span>
          <span>Irati</span>
        </div>
        <h1 id="startup-loading-title">Preparando Irati</h1>
        <p className={styles.status}>Comprobando la sesión y cargando los datos.</p>
        <div
          aria-label="Preparando la aplicación"
          className={styles.progressTrack}
          role="progressbar"
        >
          <span />
        </div>
      </section>
    </main>
  );
}
