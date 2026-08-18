"use client";

import { type ButtonHTMLAttributes } from "react";
import { useFormStatus } from "react-dom";
import styles from "./pending-submit-button.module.css";

type LoadingButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  pending?: boolean;
  pendingAriaLabel?: string;
};

export function LoadingButton({
  children,
  disabled,
  pending = false,
  pendingAriaLabel,
  ...props
}: LoadingButtonProps) {
  const ariaLabel = pendingAriaLabel ?? props["aria-label"];

  return (
    <button
      {...props}
      aria-busy={pending || undefined}
      aria-label={pending && ariaLabel ? ariaLabel : props["aria-label"]}
      disabled={pending || disabled}
    >
      {pending ? (
        <span
          aria-hidden="true"
          className={`${styles.spinner} ${
            typeof children === "string" || typeof children === "number" ? styles.withGap : ""
          }`}
        />
      ) : null}
      {children}
    </button>
  );
}

export function PendingSubmitButton({
  children,
  disabled,
  pendingAriaLabel,
  ...props
}: Omit<LoadingButtonProps, "pending">) {
  const { pending } = useFormStatus();

  return (
    <LoadingButton
      {...props}
      disabled={disabled}
      pending={pending}
      pendingAriaLabel={pendingAriaLabel}
    >
      {children}
    </LoadingButton>
  );
}
