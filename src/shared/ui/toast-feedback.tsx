"use client";

import { useEffect, useState } from "react";
import styles from "./toast-feedback.module.css";

export type ToastFeedbackMessage = {
  id: string;
  text: string;
  variant: "success" | "error";
};

type ToastFeedbackProps = {
  messages: ToastFeedbackMessage[];
  offset?: "default" | "floatingAction";
};

const AUTO_HIDE_MS = 3500;
export function ToastFeedback({ messages, offset = "default" }: ToastFeedbackProps) {
  const messageKey = messages.map((message) => message.id).join("|");

  if (messages.length === 0) {
    return null;
  }

  return <ToastMessageGroup key={messageKey} messages={messages} offset={offset} />;
}

function ToastMessageGroup({ messages, offset }: ToastFeedbackProps) {
  const [isDismissed, setIsDismissed] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const hasError = messages.some((message) => message.variant === "error");

  useEffect(() => {
    if (hasError) {
      return;
    }

    const hideTimer = window.setTimeout(() => setIsHidden(true), AUTO_HIDE_MS);

    return () => window.clearTimeout(hideTimer);
  }, [hasError]);

  if (isDismissed) {
    return null;
  }

  return (
    <div
      className={styles.viewport}
      data-offset={offset}
      data-visible={isHidden ? "false" : "true"}
    >
      {messages.map((message) => (
        <div className={styles.message} key={message.id}>
          <p
            className={styles.toast}
            data-variant={message.variant}
            role={message.variant === "error" ? "alert" : "status"}
          >
            {message.text}
          </p>
          <button
            aria-label="Cerrar mensaje"
            className={styles.dismiss}
            onClick={() => setIsDismissed(true)}
            type="button"
          >
            ×
          </button>
        </div>
      ))}
    </div>
  );
}
