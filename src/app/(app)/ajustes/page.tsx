import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import {
  BackupHealth,
  BackupRunSummary,
  getBackupHealth,
} from "@/modules/backup/application/backup-health";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { formatBirthDate } from "@/modules/profile/domain/baby-profile";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import { updateBabyProfileAction } from "./actions";
import styles from "./page.module.css";

const errorMessages: Record<string, string> = {
  save: "No se pudo guardar el perfil. Prueba otra vez.",
  validation: "Revisa el CIPA antes de guardar.",
};

type SettingsPageProps = {
  searchParams: Promise<{
    error?: string;
    updated?: string;
  }>;
};

export default async function SettingsPage({ searchParams }: SettingsPageProps) {
  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { error, updated } = await searchParams;
  const currentError = error ? errorMessages[error] : null;
  const supabase = createServerSupabaseClient();
  const [{ profile, source }, backupHealth] = await Promise.all([
    getBabyProfile(new SupabaseProfileRepository(supabase)),
    getBackupHealth(supabase),
  ]);

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Ajustes</p>
        <h1>Datos y acceso</h1>
      </header>

      {updated || currentError ? (
        <div className={styles.feedback} role="status">
          {updated ? <p className={styles.success}>Perfil actualizado.</p> : null}
          {currentError ? <p className={styles.error}>{currentError}</p> : null}
        </div>
      ) : null}

      <section className={styles.panel} aria-labelledby="profile-title">
        <div className={styles.sectionTitle}>
          <h2 id="profile-title">Perfil de Irati</h2>
          <span>{source === "database" ? "Supabase" : "Local"}</span>
        </div>
        <dl className={styles.details}>
          <div>
            <dt>Nombre</dt>
            <dd>{profile.name}</dd>
          </div>
          <div>
            <dt>Nacimiento</dt>
            <dd>{formatBirthDate(profile)}</dd>
          </div>
          <div>
            <dt>CIPA</dt>
            <dd>{profile.cipa ?? "Sin anotar"}</dd>
          </div>
        </dl>
        <form action={updateBabyProfileAction} className={styles.form}>
          <label>
            <span>CIPA</span>
            <input
              autoComplete="off"
              defaultValue={profile.cipa ?? ""}
              inputMode="text"
              maxLength={32}
              name="cipa"
              placeholder="Anotar CIPA"
              type="text"
            />
          </label>
          <button type="submit">Guardar perfil</button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="access-title">
        <div className={styles.sectionTitle}>
          <h2 id="access-title">Acceso</h2>
          <span>Activo</span>
        </div>
        <p className={styles.copy}>
          La app usa un passcode compartido. Para cambiarlo hay que actualizar la variable
          `IRATI_PASSCODE_HASH` en el servidor.
        </p>
        <form action="/logout" method="post" suppressHydrationWarning>
          <button className={styles.logout} type="submit">
            Cerrar sesion
          </button>
        </form>
      </section>

      <section className={styles.panel} aria-labelledby="technical-title">
        <div className={styles.sectionTitle}>
          <h2 id="technical-title">MVP</h2>
          <span>Conexion requerida</span>
        </div>
        <ul className={styles.list}>
          <li>PWA instalable.</li>
          <li>Datos guardados en Supabase.</li>
          <li>Sin modo offline de datos.</li>
          <li>Sin realtime, email ni push.</li>
        </ul>
      </section>

      <BackupHealthPanel health={backupHealth} />
    </main>
  );
}

function BackupHealthPanel({ health }: { health: BackupHealth }) {
  const statusCopy = getBackupStatusCopy(health);

  return (
    <section className={styles.panel} aria-labelledby="backup-title">
      <div className={styles.sectionTitle}>
        <h2 id="backup-title">Copias de seguridad</h2>
        <span className={styles[statusCopy.className]}>{statusCopy.label}</span>
      </div>
      <p className={styles.copy}>{statusCopy.description}</p>
      {health.latestSuccess ? (
        <BackupRunDetails label="Ultima correcta" run={health.latestSuccess} />
      ) : null}
      {health.latestFailure ? (
        <BackupRunDetails label="Ultimo fallo" run={health.latestFailure} />
      ) : null}
    </section>
  );
}

function BackupRunDetails({ label, run }: { label: string; run: BackupRunSummary }) {
  return (
    <dl className={styles.details}>
      <div>
        <dt>{label}</dt>
        <dd>{formatDateTime(run.finishedAt)}</dd>
      </div>
      {run.fileName ? (
        <div>
          <dt>Archivo</dt>
          <dd>{run.fileName}</dd>
        </div>
      ) : null}
      {run.fileSizeBytes ? (
        <div>
          <dt>Tamano</dt>
          <dd>{formatFileSize(run.fileSizeBytes)}</dd>
        </div>
      ) : null}
      {run.errorMessage ? (
        <div>
          <dt>Error</dt>
          <dd>{run.errorMessage}</dd>
        </div>
      ) : null}
    </dl>
  );
}

function getBackupStatusCopy(health: BackupHealth) {
  switch (health.status) {
    case "success":
      return {
        className: "statusSuccess",
        label: "Correcta",
        description: "La ultima copia correcta esta dentro de la ventana esperada.",
      };
    case "stale":
      return {
        className: "statusWarning",
        label: "Revisar",
        description: `Hace mas de ${health.staleAfterHours} horas que no hay una copia correcta.`,
      };
    case "failed":
      return {
        className: "statusWarning",
        label: "Fallando",
        description: "La ultima ejecucion registrada fallo y no hay copia correcta previa.",
      };
    case "empty":
      return {
        className: "statusWarning",
        label: "Sin copias",
        description: "Todavia no hay ninguna copia correcta registrada.",
      };
    case "unavailable":
      return {
        className: "statusWarning",
        label: "No disponible",
        description: "No se pudo leer el estado tecnico de copias de seguridad.",
      };
  }
}

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("es-ES", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function formatFileSize(bytes: number) {
  const formatter = new Intl.NumberFormat("es-ES", {
    maximumFractionDigits: 1,
  });

  if (bytes < 1024 * 1024) {
    return `${formatter.format(bytes / 1024)} KB`;
  }

  return `${formatter.format(bytes / (1024 * 1024))} MB`;
}
