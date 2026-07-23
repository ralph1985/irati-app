"use client";

import { useEffect } from "react";

export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && window.serwist !== undefined) {
      void window.serwist.register();
    }
  }, []);

  return null;
}
