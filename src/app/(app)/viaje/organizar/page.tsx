import Link from "next/link";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { listTravelChecklist } from "@/modules/travel/application/list-travel-checklist";
import { CachedTravelChecklistReadRepository } from "@/modules/travel/infrastructure/cached-travel-checklist-repository";
import { TravelOrganizationView } from "@/modules/travel/ui/travel-organization-view";
import { ToastFeedback, ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import {
  createTravelChecklistCategoryAction,
  updateTravelChecklistCategoryAction,
  deleteTravelChecklistCategoryAction,
  reorderTravelChecklistCategoriesAction,
  createTravelStorageLocationAction,
  updateTravelStorageLocationAction,
  deleteTravelStorageLocationAction,
  reorderTravelStorageLocationsAction,
} from "../actions";
import styles from "./page.module.css";

type OrganizationPageProps = {
  searchParams: Promise<{ error?: string }>;
};

const errorMessages: Record<string, string> = {
  delete: "No se puede borrar mientras la categoría o ubicación tenga dependencias.",
  load: "No pudimos cargar la organización de la lista.",
  reorder: "No pudimos guardar ese orden. La lista se ha mantenido segura.",
  save: "No pudimos guardar los cambios. Prueba otra vez.",
};

export default async function TravelOrganizationPage({ searchParams }: OrganizationPageProps) {
  const { error } = await searchParams;

  if (!(await hasValidSession())) return <LoginScreen />;

  const { checklist, loadError } = await getTravelChecklist();
  const currentError = error ?? loadError;
  const feedbackMessages: ToastFeedbackMessage[] = currentError
    ? [
        {
          id: `error-${currentError}`,
          text: errorMessages[currentError] ?? "No pudimos completar la operación.",
          variant: "error",
        },
      ]
    : [];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Viaje · Organización</p>
        <h1>Organizar la lista</h1>
        <span>Decide cómo se agrupa y dónde se guarda cada cosa.</span>
      </header>

      <ToastFeedback messages={feedbackMessages} />
      <TravelOrganizationView
        checklist={checklist}
        createCategoryAction={createTravelChecklistCategoryAction}
        updateCategoryAction={updateTravelChecklistCategoryAction}
        deleteCategoryAction={deleteTravelChecklistCategoryAction}
        reorderCategoryAction={reorderTravelChecklistCategoriesAction}
        createLocationAction={createTravelStorageLocationAction}
        updateLocationAction={updateTravelStorageLocationAction}
        deleteLocationAction={deleteTravelStorageLocationAction}
        reorderLocationAction={reorderTravelStorageLocationsAction}
      />
      <Link className={styles.bottomBackLink} href="/viaje">
        Volver a la lista de viaje
      </Link>
    </main>
  );
}

async function getTravelChecklist() {
  try {
    const checklist = await listTravelChecklist(new CachedTravelChecklistReadRepository());
    return { checklist, loadError: undefined };
  } catch {
    return {
      checklist: {
        categories: [],
        locations: [],
        groups: [],
        locationGroups: [],
        progress: { packed: 0, pending: 0, total: 0 },
      },
      loadError: "load",
    };
  }
}
