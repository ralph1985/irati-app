import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { listFriends } from "@/modules/friends/application/list-friends";
import { CachedFriendReadRepository } from "@/modules/friends/infrastructure/cached-friend-read-repository";
import { FriendsView } from "@/modules/friends/ui/friends-view";
import { ToastFeedback, type ToastFeedbackMessage } from "@/shared/ui/toast-feedback";
import {
  createFriendEntryAction,
  renameFriendGroupAction,
  updateFriendEntryAction,
} from "./actions";
import styles from "./page.module.css";

type FriendsPageProps = {
  searchParams: Promise<{
    created?: string;
    error?: string;
    groupUpdated?: string;
    updated?: string;
  }>;
};

const errorMessages: Record<string, string> = {
  save: "No pudimos guardar el cambio. Prueba otra vez.",
  validation: "Revisa el grupo, los adultos y los niños.",
};

export default async function FriendsPage({ searchParams }: FriendsPageProps) {
  const { created, error, groupUpdated, updated } = await searchParams;

  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { groups, loadError } = await getFriends();

  return (
    <main className={styles.main}>
      <header className={styles.header}>
        <p>Personas importantes</p>
        <h1>Amigos de Irati</h1>
        <span>Una ayuda para recordar sus nombres.</span>
      </header>
      {loadError ? (
        <p className={styles.error} role="alert">
          No pudimos cargar la lista de amigos. Prueba otra vez.
        </p>
      ) : null}
      <ToastFeedback
        messages={buildFeedbackMessages({ created, error, groupUpdated, loadError, updated })}
        offset="floatingAction"
      />
      <FriendsView
        createAction={createFriendEntryAction}
        groups={groups}
        renameGroupAction={renameFriendGroupAction}
        updateAction={updateFriendEntryAction}
      />
    </main>
  );
}

function buildFeedbackMessages({
  created,
  error,
  groupUpdated,
  loadError,
  updated,
}: {
  created?: string;
  error?: string;
  groupUpdated?: string;
  loadError: boolean;
  updated?: string;
}): ToastFeedbackMessage[] {
  return [
    ...(created ? [{ id: "created", text: "Amigo añadido.", variant: "success" as const }] : []),
    ...(updated
      ? [{ id: "updated", text: "Amigo actualizado.", variant: "success" as const }]
      : []),
    ...(groupUpdated
      ? [{ id: "group-updated", text: "Grupo actualizado.", variant: "success" as const }]
      : []),
    ...(error || loadError
      ? [
          {
            id: `error-${error ?? "load"}`,
            text: errorMessages[error ?? ""] ?? "No pudimos cargar la lista de amigos.",
            variant: "error" as const,
          },
        ]
      : []),
  ];
}

async function getFriends() {
  try {
    const friends = await listFriends(new CachedFriendReadRepository());
    return { groups: friends.groups, loadError: false };
  } catch {
    return { groups: [], loadError: true };
  }
}
