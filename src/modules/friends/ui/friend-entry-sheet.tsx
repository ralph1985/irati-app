"use client";

import { FormEvent, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { PendingSubmitButton } from "../../../shared/ui/pending-submit-button";
import type { FriendEntry } from "../domain/friend-entry";
import styles from "./friends-view.module.css";

type FriendEntrySheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  entry?: FriendEntry;
  initiallyOpen?: boolean;
  onClose?: () => void;
};

export function FriendEntrySheet({
  action,
  entry,
  initiallyOpen = false,
  onClose,
}: FriendEntrySheetProps) {
  const [isOpen, setIsOpen] = useState(initiallyOpen);
  const [offlineError, setOfflineError] = useState<string | null>(null);

  function closeSheet() {
    setIsOpen(false);
    setOfflineError(null);
    onClose?.();
  }

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (navigator.onLine) {
      return;
    }

    event.preventDefault();
    setOfflineError("Necesitas conexión para guardar cambios.");
  }

  return (
    <>
      {entry ? (
        <button
          aria-label={`Editar amigo ${entry.adultsLabel}`}
          className={styles.editEntryButton}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          Editar
        </button>
      ) : (
        <button
          aria-label="Añadir amigo"
          className={styles.floatingAddButton}
          onClick={() => setIsOpen(true)}
          type="button"
        >
          +
        </button>
      )}
      {isOpen ? (
        <BottomSheet
          ariaLabel={entry ? "Cerrar edición de amigo" : "Cerrar nuevo amigo"}
          labelledBy="friend-entry-sheet-title"
          onClose={closeSheet}
          styles={styles}
        >
          <form action={action} className={styles.sheetBody} onSubmit={handleSubmit}>
            <div className={styles.sheetHeader}>
              <p>Amigos de Irati</p>
              <h2 id="friend-entry-sheet-title">{entry ? "Editar amigo" : "Añadir amigo"}</h2>
            </div>
            {entry ? <input name="id" type="hidden" value={entry.id} /> : null}
            <div className={styles.sheetFields}>
              <label>
                Grupo
                <input
                  defaultValue={entry?.groupLabel ?? ""}
                  name="groupLabel"
                  placeholder="Ej. Kamikazes"
                  type="text"
                />
              </label>
              <label>
                Adultos
                <input
                  defaultValue={entry?.adultsLabel ?? ""}
                  name="adultsLabel"
                  placeholder="Ej. Jota y Paula"
                  required
                  type="text"
                />
              </label>
              <label>
                Niños
                <input
                  defaultValue={entry?.childrenLabel ?? ""}
                  name="childrenLabel"
                  placeholder="Ej. Leire"
                  required
                  type="text"
                />
              </label>
            </div>
            {offlineError ? <p role="alert">{offlineError}</p> : null}
            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeSheet} type="button">
                Cancelar
              </button>
              <PendingSubmitButton className={styles.primaryButton} type="submit">
                Guardar
              </PendingSubmitButton>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}
