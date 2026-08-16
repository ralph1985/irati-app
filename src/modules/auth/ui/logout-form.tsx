"use client";

import { useState, type FormEvent } from "react";
import { clearOfflineData } from "@/shared/infrastructure/offline/irati-offline-db";
import { PendingSubmitButton } from "@/shared/ui/pending-submit-button";

type LogoutFormProps = {
  buttonClassName?: string;
  label?: string;
};

export function LogoutForm({ buttonClassName, label = "Salir" }: LogoutFormProps) {
  const [error, setError] = useState<string | null>(null);

  async function submitLogout(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    try {
      await clearOfflineData();
      event.currentTarget.submit();
    } catch {
      setError("No se pudo limpiar la copia local. No se ha cerrado la sesion.");
    }
  }

  return (
    <form action="/logout" method="post" onSubmit={submitLogout} suppressHydrationWarning>
      {error ? <p role="alert">{error}</p> : null}
      <PendingSubmitButton className={buttonClassName} type="submit">
        {label}
      </PendingSubmitButton>
    </form>
  );
}
