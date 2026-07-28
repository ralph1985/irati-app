import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { loadCalendarFeed } from "@/modules/calendar/application/calendar-feed";
import { CalendarView } from "@/modules/calendar/ui/calendar-view";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import styles from "./page.module.css";

export default async function CalendarPage() {
  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const result = await loadCalendarFeed();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Calendario</p>
        <h1>Agenda de Irati</h1>
      </header>
      <CalendarView initialError={result.error} initialSnapshot={result.snapshot} />
    </main>
  );
}
