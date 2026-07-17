import { cookies } from "next/headers";
import { getBabyProfile } from "@/modules/profile/application/get-baby-profile";
import { formatBirthDate } from "@/modules/profile/domain/baby-profile";
import { SupabaseProfileRepository } from "@/modules/profile/infrastructure/supabase-profile-repository";
import { AUTH_SESSION_COOKIE } from "@/modules/auth/domain/auth-session";
import { getRequiredEnv } from "@/modules/auth/infrastructure/env";
import { verifySessionToken } from "@/modules/auth/infrastructure/session-token";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { createServerSupabaseClient } from "@/shared/infrastructure/supabase/server-client";
import Link from "next/link";
import styles from "./page.module.css";

type HomeProps = {
  searchParams: Promise<{
    error?: string;
  }>;
};

export default async function Home({ searchParams }: HomeProps) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(AUTH_SESSION_COOKIE)?.value;
  const { error } = await searchParams;

  if (!isAuthenticated(sessionToken)) {
    return <LoginScreen error={error} />;
  }

  const { profile, source } = await getBabyProfile(
    new SupabaseProfileRepository(createServerSupabaseClient()),
  );

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <section className={styles.hero} aria-labelledby="home-title">
          <p className={styles.kicker}>App privada familiar</p>
          <h1 id="home-title">{profile.name}</h1>
          <p className={styles.birthDate}>Nacida el {formatBirthDate(profile)}</p>
          {source === "fallback" ? (
            <p className={styles.dataNotice}>Mostrando datos locales temporales.</p>
          ) : null}
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

        <form action="/logout" method="post" suppressHydrationWarning>
          <button className={styles.logout} type="submit">
            Salir
          </button>
        </form>
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

function isAuthenticated(sessionToken: string | undefined): boolean {
  try {
    return verifySessionToken(sessionToken, getRequiredEnv("SESSION_SECRET"));
  } catch {
    return false;
  }
}
