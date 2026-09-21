"use client";

import { useMemo, useState } from "react";
import { filterFriendGroups, type FriendGroup } from "../domain/friend-entry";
import { FriendEntrySheet } from "./friend-entry-sheet";
import { FriendGroupSheet } from "./friend-group-sheet";
import styles from "./friends-view.module.css";

type FriendAction = (formData: FormData) => void | Promise<void>;

type FriendsViewProps = {
  createAction?: FriendAction;
  groups: FriendGroup[];
  renameGroupAction?: FriendAction;
  updateAction?: FriendAction;
};

export function FriendsView({
  createAction = async () => {},
  groups,
  renameGroupAction = async () => {},
  updateAction = async () => {},
}: FriendsViewProps) {
  const [query, setQuery] = useState("");
  const visibleGroups = useMemo(() => filterFriendGroups(groups, query), [groups, query]);
  const hasQuery = query.trim().length > 0;

  return (
    <div className={styles.view}>
      <FriendEntrySheet action={createAction} />
      {groups.length === 0 ? (
        <p className={styles.emptyState}>Todavía no hay amigos guardados.</p>
      ) : (
        <>
          <div className={styles.searchPanel}>
            <label className={styles.searchLabel} htmlFor="friends-search">
              Buscar por padres o niños
            </label>
            <input
              autoComplete="off"
              className={styles.searchInput}
              id="friends-search"
              onChange={(event) => setQuery(event.currentTarget.value)}
              placeholder="Ej. Leire o Jota"
              type="search"
              value={query}
            />
          </div>
          {visibleGroups.length === 0 ? (
            <p className={styles.emptyState}>No encontramos coincidencias.</p>
          ) : (
            visibleGroups.map((group) => (
              <details className={styles.group} key={group.label} open={hasQuery}>
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
                      <div className={styles.entryContent}>
                        <span className={styles.adults}>{entry.adultsLabel}</span>
                        <strong className={styles.children}>{entry.childrenLabel}</strong>
                      </div>
                      <FriendEntrySheet action={updateAction} entry={entry} />
                    </li>
                  ))}
                </ul>
                {group.label !== "Sin grupo" ? (
                  <FriendGroupSheet action={renameGroupAction} currentLabel={group.label} />
                ) : null}
              </details>
            ))
          )}
        </>
      )}
    </div>
  );
}
