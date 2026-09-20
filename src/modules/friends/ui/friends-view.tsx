import type { FriendGroup } from "../domain/friend-entry";
import styles from "./friends-view.module.css";

export function FriendsView({ groups }: { groups: FriendGroup[] }) {
  return (
    <div className={styles.view}>
      {groups.length === 0 ? (
        <p className={styles.emptyState}>Todavía no hay amigos guardados.</p>
      ) : (
        groups.map((group) => (
          <section
            aria-labelledby={`friends-${getGroupId(group.label)}`}
            className={styles.group}
            key={group.label}
          >
            <div className={styles.groupHeading}>
              <p className={styles.eyebrow}>Grupo</p>
              <h2 id={`friends-${getGroupId(group.label)}`}>{group.label}</h2>
            </div>
            <ul className={styles.entries}>
              {group.entries.map((entry) => (
                <li className={styles.entry} key={entry.id}>
                  <span className={styles.adults}>{entry.adultsLabel}</span>
                  <strong className={styles.children}>{entry.childrenLabel}</strong>
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}

function getGroupId(label: string): string {
  return label
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
