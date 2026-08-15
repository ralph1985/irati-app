import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { listTravelChecklist } from "@/modules/travel/application/list-travel-checklist";
import { CachedTravelChecklistReadRepository } from "@/modules/travel/infrastructure/cached-travel-checklist-repository";
import { TravelChecklistView } from "@/modules/travel/ui/travel-checklist-view";
import { ToastFeedback, ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import {
  createTravelChecklistItemAction,
  deleteTravelChecklistItemAction,
  resetTravelChecklistAction,
  reorderTravelChecklistItemsAction,
  reorderTravelChecklistItemsByLocationAction,
  setTravelChecklistItemPackedAction,
  updateTravelChecklistItemAction,
  createTravelChecklistCategoryAction,
  updateTravelChecklistCategoryAction,
  deleteTravelChecklistCategoryAction,
  createTravelStorageLocationAction,
  updateTravelStorageLocationAction,
  deleteTravelStorageLocationAction,
} from "./actions";
import styles from "./page.module.css";

type TravelPageProps = {
  searchParams: Promise<{
    created?: string;
    deleted?: string;
    error?: string;
    reset?: string;
    updated?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  validation: "Revisa el texto y la categoría.",
  save: "No pudimos guardar el elemento. Prueba otra vez.",
  delete: "No pudimos borrar el elemento. Prueba otra vez.",
  reset: "No pudimos reiniciar la lista. Prueba otra vez.",
  load: "No pudimos cargar la lista de viaje.",
};

export default async function TravelPage({ searchParams }: TravelPageProps) {
  const { created, deleted, error, reset, updated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { checklist, loadError } = await getTravelChecklist();
  const currentError = error ?? loadError;
  const feedbackMessages: ToastFeedbackMessage[] = [
    ...(created
      ? [{ id: "created", text: "Añadido a la lista.", variant: "success" as const }]
      : []),
    ...(updated
      ? [{ id: "updated", text: "Elemento actualizado.", variant: "success" as const }]
      : []),
    ...(deleted ? [{ id: "deleted", text: "Elemento borrado.", variant: "success" as const }] : []),
    ...(reset ? [{ id: "reset", text: "Lista reiniciada.", variant: "success" as const }] : []),
    ...(currentError
      ? [
          {
            id: `error-${currentError}`,
            text: errorMessages[currentError],
            variant: "error" as const,
          },
        ]
      : []),
  ];

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Viaje</p>
        <h1>Maleta de Irati</h1>
      </header>

      <ToastFeedback messages={feedbackMessages} />

      <TravelChecklistView
        checklist={checklist}
        createAction={createTravelChecklistItemAction}
        deleteAction={deleteTravelChecklistItemAction}
        resetAction={resetTravelChecklistAction}
        reorderAction={reorderTravelChecklistItemsAction}
        reorderStorageAction={reorderTravelChecklistItemsByLocationAction}
        setPackedAction={setTravelChecklistItemPackedAction}
        updateAction={updateTravelChecklistItemAction}
        createCategoryAction={createTravelChecklistCategoryAction}
        updateCategoryAction={updateTravelChecklistCategoryAction}
        deleteCategoryAction={deleteTravelChecklistCategoryAction}
        createLocationAction={createTravelStorageLocationAction}
        updateLocationAction={updateTravelStorageLocationAction}
        deleteLocationAction={deleteTravelStorageLocationAction}
      />
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
        progress: {
          packed: 0,
          pending: 0,
          total: 0,
        },
      },
      loadError: "load",
    };
  }
}
