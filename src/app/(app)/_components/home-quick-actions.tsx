"use client";

import { useState } from "react";
import { BottomSheet } from "@/shared/ui/bottom-sheet";
import { WeightCreateSheet } from "@/modules/weight/ui/weight-create-sheet";
import styles from "../page.module.css";

type HomeQuickActionsProps = {
  createWeightAction: (formData: FormData) => void | Promise<void>;
};

export function HomeQuickActions({ createWeightAction }: HomeQuickActionsProps) {
  const [openSheet, setOpenSheet] = useState<"menu" | "weight" | null>(null);

  return (
    <>
      <section className={styles.quickActions} aria-label="Acciones rápidas">
        <button
          aria-expanded={openSheet === "menu"}
          aria-haspopup="dialog"
          className={styles.addButton}
          onClick={() => setOpenSheet("menu")}
          type="button"
        >
          <span aria-hidden="true">+</span>
          Añadir
        </button>
      </section>

      {openSheet === "menu" ? (
        <BottomSheet
          ariaLabel="Cerrar menú Añadir"
          labelledBy="home-add-title"
          onClose={() => setOpenSheet(null)}
          styles={styles}
        >
          <div className={styles.addMenu}>
            <div className={styles.sheetHeader}>
              <p>Acciones</p>
              <h2 id="home-add-title">¿Qué quieres hacer?</h2>
            </div>

            <div className={styles.addMenuOptions}>
              <button
                className={styles.addMenuButton}
                onClick={() => setOpenSheet("weight")}
                type="button"
              >
                <span aria-hidden="true">+</span>
                Añadir peso
              </button>
            </div>
          </div>
        </BottomSheet>
      ) : null}

      {openSheet === "weight" ? (
        <WeightCreateSheet
          action={createWeightAction}
          initiallyOpen
          onClose={() => setOpenSheet(null)}
          returnTo="/"
          styles={styles}
        />
      ) : null}
    </>
  );
}
