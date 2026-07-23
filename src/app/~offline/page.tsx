import { OfflineSnapshotView } from "@/shared/infrastructure/offline/offline-snapshot-view";
import styles from "./page.module.css";

export default function OfflineFallbackPage() {
  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Offline</p>
        <h1>Sin conexión</h1>
        <p className={styles.copy}>
          Irati no puede conectar con el servidor. Puedes revisar la última copia guardada en este
          dispositivo.
        </p>
      </header>

      <OfflineSnapshotView styles={styles} />
    </main>
  );
}
