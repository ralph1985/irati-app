"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type ReactNode } from "react";
import styles from "./app-shell.module.css";

const tabs = [
  { href: "/", label: "Inicio" },
  { href: "/peso", label: "Peso" },
  { href: "/vacunas", label: "Vacunas" },
  { href: "/ajustes", label: "Ajustes" },
] as const;

const tabOrder = new Map<string, number>(tabs.map((tab, index) => [tab.href, index]));

type Direction = "backward" | "forward" | "none";

type ViewLayer = {
  direction: Direction;
  id: number;
  node: ReactNode;
  pathname: string;
  state: "current" | "exiting";
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const nextLayerId = useRef(0);
  const [layers, setLayers] = useState<ViewLayer[]>([
    {
      direction: "none",
      id: 0,
      node: children,
      pathname,
      state: "current",
    },
  ]);

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setLayers((currentLayers) => currentLayers.filter((layer) => layer.state === "current"));
    }, 220);

    setLayers((currentLayers) => {
      const currentLayer = currentLayers.find((layer) => layer.state === "current");

      if (!currentLayer || currentLayer.pathname === pathname) {
        return [
          {
            direction: "none",
            id: currentLayer?.id ?? nextLayerId.current,
            node: children,
            pathname,
            state: "current",
          },
        ];
      }

      const direction = getDirection(currentLayer.pathname, pathname);
      nextLayerId.current += 1;

      return [
        {
          ...currentLayer,
          direction,
          state: "exiting",
        },
        {
          direction,
          id: nextLayerId.current,
          node: children,
          pathname,
          state: "current",
        },
      ];
    });

    return () => window.clearTimeout(timeoutId);
  }, [children, pathname]);

  return (
    <div className={styles.page}>
      <div className={styles.view}>
        {layers.map((layer) => (
          <div
            className={styles.viewLayer}
            data-direction={layer.direction}
            data-state={layer.state}
            key={layer.id}
          >
            {layer.node}
          </div>
        ))}
      </div>

      <nav className={styles.nav} aria-label="Navegacion principal">
        {tabs.map((tab) => (
          <Link
            aria-current={pathname === tab.href ? "page" : undefined}
            href={tab.href}
            key={tab.href}
          >
            {tab.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}

function getDirection(previousPathname: string, pathname: string): Direction {
  if (previousPathname === pathname) {
    return "none";
  }

  const previousIndex = tabOrder.get(previousPathname);
  const currentIndex = tabOrder.get(pathname);

  if (previousIndex === undefined || currentIndex === undefined) {
    return "none";
  }

  return currentIndex > previousIndex ? "forward" : "backward";
}
