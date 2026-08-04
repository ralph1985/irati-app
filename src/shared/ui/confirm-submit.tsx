"use client";

import { FormEvent, ReactNode, useEffect, useRef, useState } from "react";
import styles from "./confirm-submit.module.css";

type ConfirmSubmitProps = {
  action: (formData: FormData) => void | Promise<void>;
  children: ReactNode;
  className?: string;
  message: string;
  onConfirmedSubmit?: (event: FormEvent<HTMLFormElement>) => void;
};

export function ConfirmSubmit({
  action,
  children,
  className,
  message,
  onConfirmedSubmit,
}: ConfirmSubmitProps) {
  const [isOpen, setIsOpen] = useState(false);
  const confirmButtonRef = useRef<HTMLButtonElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const confirmedRef = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    confirmButtonRef.current?.focus();

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setIsOpen(false);
      }
    }

    document.addEventListener("keydown", handleKeyDown);

    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    if (confirmedRef.current) {
      confirmedRef.current = false;
      onConfirmedSubmit?.(event);
      return;
    }

    event.preventDefault();
    setIsOpen(true);
  }

  function confirmSubmit() {
    confirmedRef.current = true;
    setIsOpen(false);
    requestAnimationFrame(() => formRef.current?.requestSubmit());
  }

  return (
    <>
      <form action={action} className={className} onSubmit={handleSubmit} ref={formRef}>
        {children}
      </form>
      {isOpen ? (
        <div className={styles.backdrop} onClick={() => setIsOpen(false)} role="presentation">
          <section
            aria-labelledby="confirm-submit-title"
            aria-modal="true"
            className={styles.dialog}
            onClick={(event) => event.stopPropagation()}
            role="dialog"
          >
            <h2 id="confirm-submit-title">Confirmar acción</h2>
            <p>{message}</p>
            <div className={styles.actions}>
              <button className={styles.cancel} onClick={() => setIsOpen(false)} type="button">
                Cancelar
              </button>
              <button
                className={styles.confirm}
                onClick={confirmSubmit}
                ref={confirmButtonRef}
                type="button"
              >
                Confirmar
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </>
  );
}
