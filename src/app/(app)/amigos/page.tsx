import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { listFriends } from "@/modules/friends/application/list-friends";
import { CachedFriendReadRepository } from "@/modules/friends/infrastructure/cached-friend-read-repository";
import { FriendsView } from "@/modules/friends/ui/friends-view";
import styles from "./page.module.css";

export default async function FriendsPage() {
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
      <FriendsView groups={groups} />
    </main>
  );
}

async function getFriends() {
  try {
    const friends = await listFriends(new CachedFriendReadRepository());
    return { groups: friends.groups, loadError: false };
  } catch {
    return { groups: [], loadError: true };
  }
}
