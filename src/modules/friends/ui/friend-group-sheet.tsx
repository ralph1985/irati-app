"use client";

import { FormEvent, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";
import { PendingSubmitButton } from "../../../shared/ui/pending-submit-button";
import styles from "./friends-view.module.css";

type FriendGroupSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  currentLabel: string;
  initiallyOpen?: boolean;
  onClose?: () => void;
};

export function FriendGroupSheet({
  action,
  currentLabel,
  initiallyOpen = false,
  onClose,
}: FriendGroupSheetProps) {
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
      <button
        aria-label={`Editar grupo ${currentLabel}`}
        className={styles.editGroupButton}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        Editar grupo
      </button>
      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar edición de grupo"
          labelledBy="friend-group-sheet-title"
          onClose={closeSheet}
          styles={styles}
        >
          <form action={action} className={styles.sheetBody} onSubmit={handleSubmit}>
            <div className={styles.sheetHeader}>
              <p>Amigos de Irati</p>
              <h2 id="friend-group-sheet-title">Editar grupo</h2>
            </div>
            <input name="currentLabel" type="hidden" value={currentLabel} />
            <label>
              Nuevo nombre
              <input defaultValue={currentLabel} name="nextLabel" required type="text" />
            </label>
            <p className={styles.sheetHint}>
              El cambio se aplicará a todas las personas de este grupo.
            </p>
            {offlineError ? <p role="alert">{offlineError}</p> : null}
            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeSheet} type="button">
                Cancelar
              </button>
              <PendingSubmitButton className={styles.primaryButton} type="submit">
                Guardar grupo
              </PendingSubmitButton>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}
