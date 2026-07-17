import { cookies } from "next/headers";
import { iratiProfile } from "@/modules/profile/domain/baby-profile";
import { AUTH_SESSION_COOKIE } from "@/modules/auth/domain/auth-session";
import { getRequiredEnv } from "@/modules/auth/infrastructure/env";
import { verifySessionToken } from "@/modules/auth/infrastructure/session-token";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
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

        <form action="/logout" method="post">
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
