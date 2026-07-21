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
const EXIT_MS = 220;

export function ToastFeedback({ messages, offset = "default" }: ToastFeedbackProps) {
  const [hiddenKey, setHiddenKey] = useState<string | null>(null);
  const [removedKey, setRemovedKey] = useState<string | null>(null);
  const messageKey = messages.map((message) => message.id).join("|");

  useEffect(() => {
    if (messages.length === 0) {
      return;
    }

    const hideTimer = window.setTimeout(() => {
      setHiddenKey(messageKey);
    }, AUTO_HIDE_MS);
    const unmountTimer = window.setTimeout(() => {
      setRemovedKey(messageKey);
    }, AUTO_HIDE_MS + EXIT_MS);

    return () => {
      window.clearTimeout(hideTimer);
      window.clearTimeout(unmountTimer);
    };
  }, [messageKey, messages]);

  if (messages.length === 0 || removedKey === messageKey) {
    return null;
  }

  const isVisible = hiddenKey !== messageKey;

  return (
    <div
      className={styles.viewport}
      data-offset={offset}
      data-visible={isVisible ? "true" : "false"}
    >
      {messages.map((message) => (
        <p
          className={styles.toast}
          data-variant={message.variant}
          key={message.id}
          role={message.variant === "error" ? "alert" : "status"}
        >
          {message.text}
        </p>
      ))}
    </div>
  );
}
