"use client";

import { ReactNode, useState } from "react";
import { BottomSheet } from "../../../shared/ui/bottom-sheet";

type WeightCreateSheetProps = {
  action: (formData: FormData) => void | Promise<void>;
  buttonClassName?: string;
  children?: ReactNode;
  returnTo?: string;
  styles: Record<string, string>;
};

export function WeightCreateSheet({
  action,
  buttonClassName,
  children = "+",
  returnTo,
  styles,
}: WeightCreateSheetProps) {
  const [isOpen, setIsOpen] = useState(false);

  function openSheet() {
    setIsOpen(true);
  }

  function closeSheet() {
    setIsOpen(false);
  }

  return (
    <>
      <button
        aria-label="Añadir peso"
        className={buttonClassName ?? styles.floatingAddButton}
        onClick={openSheet}
        type="button"
      >
        {children}
      </button>

      {isOpen ? (
        <BottomSheet
          ariaLabel="Cerrar panel de peso"
          labelledBy="new-weight-title"
          onClose={closeSheet}
          styles={styles}
        >
          <form action={action} className={styles.sheetBody}>
            <div className={styles.sheetHeader}>
              <p>Peso</p>
              <h2 id="new-weight-title">Nuevo peso</h2>
            </div>

            {returnTo ? <input name="returnTo" type="hidden" value={returnTo} /> : null}

            <div className={styles.sheetFields}>
              <label>
                Fecha
                <input name="measuredOn" required type="date" />
              </label>

              <label>
                Gramos
                <input
                  inputMode="numeric"
                  max="20000"
                  min="1000"
                  name="weightGrams"
                  required
                  type="number"
                />
              </label>

              <label>
                Lugar
                <select defaultValue="pediatra" name="place" required>
                  <option value="hospital">Hospital</option>
                  <option value="pediatra">Pediatra</option>
                  <option value="farmacia">Farmacia</option>
                </select>
              </label>

              <label className={styles.full}>
                Notas
                <textarea name="notes" rows={3} />
              </label>
            </div>

            <div className={styles.sheetActions}>
              <button className={styles.secondaryButton} onClick={closeSheet} type="button">
                Cancelar
              </button>
              <button className={styles.primaryButton} type="submit">
                Guardar peso
              </button>
            </div>
          </form>
        </BottomSheet>
      ) : null}
    </>
  );
}
