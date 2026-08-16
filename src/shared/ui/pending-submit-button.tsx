"use client";

import { type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";

export function PendingSubmitButton({
  children,
  disabled,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  const { pending } = useFormStatus();

  return (
    <button {...props} aria-busy={pending || undefined} disabled={pending || disabled}>
      {pending ? <span aria-hidden="true">…</span> : children}
    </button>
  );
}
