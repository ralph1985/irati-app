/// <reference lib="webworker" />

import type { PrecacheEntry, SerwistGlobalConfig } from "serwist";
import { CacheFirst, ExpirationPlugin, Serwist, type RuntimeCaching } from "serwist";

declare global {
  interface WorkerGlobalScope extends SerwistGlobalConfig {
    __SW_MANIFEST: (PrecacheEntry | string)[] | undefined;
  }
}

declare const self: ServiceWorkerGlobalScope;

const staticAssetCache: RuntimeCaching[] = [
  {
    handler: new CacheFirst({
      cacheName: "irati-static-assets",
      plugins: [
        new ExpirationPlugin({
          maxAgeSeconds: 60 * 60 * 24 * 30,
          maxEntries: 80,
        }),
      ],
    }),
    matcher({ request, sameOrigin }: { request: Request; sameOrigin: boolean }) {
      return sameOrigin && ["font", "image", "script", "style"].includes(request.destination);
    },
  },
];

const serwist = new Serwist({
  clientsClaim: true,
  disableDevLogs: true,
  fallbacks: {
    entries: [
      {
        matcher({ request }) {
          return request.destination === "document";
        },
        url: "/~offline",
      },
    ],
  },
  navigationPreload: true,
  precacheEntries: self.__SW_MANIFEST,
  runtimeCaching: staticAssetCache,
  skipWaiting: true,
});

serwist.addEventListeners();
