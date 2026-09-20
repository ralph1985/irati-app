import type { FriendGroup } from "../domain/friend-entry";
import styles from "./friends-view.module.css";

export function FriendsView({ groups }: { groups: FriendGroup[] }) {
  return (
    <div className={styles.view}>
      {groups.length === 0 ? (
        <p className={styles.emptyState}>Todavía no hay amigos guardados.</p>
      ) : (
        groups.map((group) => (
          <details className={styles.group} key={group.label}>
            <summary className={styles.groupSummary}>
              <span className={styles.groupHeading}>
                <span className={styles.eyebrow}>Grupo</span>
                <span className={styles.groupTitle}>{group.label}</span>
              </span>
              <span aria-hidden="true" className={styles.groupToggle}>
                +
              </span>
            </summary>
            <ul className={styles.entries}>
              {group.entries.map((entry) => (
                <li className={styles.entry} key={entry.id}>
                  <span className={styles.adults}>{entry.adultsLabel}</span>
                  <strong className={styles.children}>{entry.childrenLabel}</strong>
                </li>
              ))}
            </ul>
          </details>
        ))
      )}
    </div>
  );
}
