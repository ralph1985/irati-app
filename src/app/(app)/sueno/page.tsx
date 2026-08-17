import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { SleepView } from "@/modules/sleep/ui/sleep-view";
import { listSleepEntries } from "@/modules/sleep/application/list-sleep-entries";
import { CachedSleepRepository } from "@/modules/sleep/infrastructure/cached-sleep-repository";
import { ToastFeedback, type ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import { createSleepEntryAction, deleteSleepEntryAction, updateSleepEntryAction } from "./actions";
import styles from "./page.module.css";

export default async function SleepPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string; deleted?: string; error?: string; updated?: string }>;
}) {
  const { created, deleted, error, updated } = await searchParams;
  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { entries, loadError } = await getSleepEntries();
  const currentError = error ?? loadError;
  const feedbackMessages: ToastFeedbackMessage[] = [
    ...(created
      ? [{ id: "created", text: "Descanso guardado.", variant: "success" as const }]
      : []),
    ...(updated
      ? [{ id: "updated", text: "Descanso actualizado.", variant: "success" as const }]
      : []),
    ...(deleted ? [{ id: "deleted", text: "Descanso borrado.", variant: "success" as const }] : []),
    ...(currentError
      ? [{ id: "error", text: getErrorMessage(currentError), variant: "error" as const }]
      : []),
  ];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Sueño</p>
        <h1>El descanso de Irati</h1>
      </header>
      <ToastFeedback messages={feedbackMessages} offset="floatingAction" />
      <SleepView
        createAction={createSleepEntryAction}
        deleteAction={deleteSleepEntryAction}
        entries={entries}
        updateAction={updateSleepEntryAction}
      />
    </main>
  );
}

async function getSleepEntries() {
  try {
    return { entries: await listSleepEntries(new CachedSleepRepository()), loadError: null };
  } catch {
    return { entries: [], loadError: "load" };
  }
}

function getErrorMessage(error: string | undefined) {
  if (error === "validation") return "Revisa las horas del descanso.";
  if (error === "delete") return "No pudimos borrar el descanso. Prueba otra vez.";
  if (error === "load") return "No pudimos cargar el historial de sueño.";
  return "No pudimos guardar el descanso. Prueba otra vez.";
}
