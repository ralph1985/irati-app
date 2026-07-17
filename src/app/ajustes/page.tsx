import Link from "next/link";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { formatBirthDate } from "@/modules/profile/domain/baby-profile";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import styles from "./page.module.css";

export default async function SettingsPage() {
  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { profile, source } = await getBabyProfile(
    new SupabaseProfileRepository(createServerSupabaseClient()),
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <header className={styles.header}>
          <p>Ajustes</p>
          <h1>Datos y acceso</h1>
        </header>

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
          </dl>
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
      </main>

      <nav className={styles.nav} aria-label="Navegacion principal">
        <Link href="/">Inicio</Link>
        <Link href="/peso">Peso</Link>
        <Link href="/vacunas">Vacunas</Link>
        <Link aria-current="page" href="/ajustes">
          Ajustes
        </Link>
      </nav>
    </div>
  );
}
