"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { OfflineSnapshotHydrator } from "@/shared/infrastructure/offline/offline-snapshot-hydrator";
import styles from "./app-shell.module.css";

const tabs = [
  { href: "/", icon: "home", label: "Inicio" },
  { href: "/peso", icon: "weight", label: "Peso" },
  { href: "/vacunas", icon: "vaccine", label: "Vacunas" },
  { href: "/viaje", icon: "bag", label: "Viaje" },
  { href: "/ajustes", icon: "settings", label: "Ajustes" },
] as const;

const tabOrder = new Map<string, number>(tabs.map((tab, index) => [tab.href, index]));

type TabIcon = (typeof tabs)[number]["icon"];

type Direction = "backward" | "forward" | "none";

type NavigationState = {
  direction: Direction;
  pathname: string;
};

const viewVariants: Variants = {
  enter: (direction: Direction) => ({
    opacity: direction === "none" ? 1 : 0,
    x: getOffset(direction, "enter"),
  }),
  center: {
    opacity: 1,
    x: 0,
  },
  exit: (direction: Direction) => ({
    opacity: direction === "none" ? 1 : 0,
    x: getOffset(direction, "exit"),
  }),
};

const reducedMotionVariants: Variants = {
  enter: { opacity: 1, x: 0 },
  center: { opacity: 1, x: 0 },
  exit: { opacity: 1, x: 0 },
};

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [navigationState, setNavigationState] = useState<NavigationState>(() => ({
    direction: "none",
    pathname,
  }));
  const shouldReduceMotion = useReducedMotion();

  let currentNavigationState = navigationState;

  if (navigationState.pathname !== pathname) {
    currentNavigationState = {
      direction: getDirection(navigationState.pathname, pathname),
      pathname,
    };
    setNavigationState(currentNavigationState);
  }

  const direction = currentNavigationState.direction;

  return (
    <div className={styles.page}>
      <OfflineSnapshotHydrator />
      <div className={styles.view}>
        <AnimatePresence custom={direction} initial={false} mode="popLayout">
          <motion.div
            animate="center"
            className={styles.viewLayer}
            custom={direction}
            exit="exit"
            initial="enter"
            key={pathname}
            transition={{ duration: shouldReduceMotion ? 0 : 0.26, ease: [0.32, 0.72, 0, 1] }}
            variants={shouldReduceMotion ? reducedMotionVariants : viewVariants}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </div>

      <nav className={styles.nav} aria-label="Navegacion principal">
        {tabs.map((tab) => (
          <Link
            aria-current={pathname === tab.href ? "page" : undefined}
            aria-label={tab.label}
            href={tab.href}
            key={tab.href}
            title={tab.label}
          >
            <TabIcon name={tab.icon} />
            <span className={styles.srOnly}>{tab.label}</span>
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

function getOffset(direction: Direction, phase: "enter" | "exit"): string {
  if (direction === "none") {
    return "0%";
  }

  if (phase === "enter") {
    return direction === "forward" ? "100%" : "-100%";
  }

  return direction === "forward" ? "-100%" : "100%";
}

function TabIcon({ name }: { name: TabIcon }) {
  switch (name) {
    case "home":
      return (
        <svg aria-hidden="true" className={styles.navIcon} viewBox="0 0 24 24">
          <path d="M4 11.5 12 5l8 6.5" />
          <path d="M6.5 10.5V19h11v-8.5" />
          <path d="M10 19v-5h4v5" />
        </svg>
      );
    case "weight":
      return (
        <svg aria-hidden="true" className={styles.navIcon} viewBox="0 0 24 24">
          <path d="M6 20h12l1.5-12h-15L6 20Z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
          <path d="M12 12v3" />
        </svg>
      );
    case "vaccine":
      return (
        <svg aria-hidden="true" className={styles.navIcon} viewBox="0 0 24 24">
          <path d="m15 4 5 5" />
          <path d="m14 9 1.5-1.5" />
          <path d="m16.5 11.5-8 8L5 16l8-8" />
          <path d="m7 14 3 3" />
          <path d="M4 20h4" />
        </svg>
      );
    case "bag":
      return (
        <svg aria-hidden="true" className={styles.navIcon} viewBox="0 0 24 24">
          <path d="M6.5 8.5h11L19 20H5L6.5 8.5Z" />
          <path d="M9 8.5a3 3 0 0 1 6 0" />
          <path d="m9.5 14 1.8 1.8 3.7-4" />
        </svg>
      );
    case "settings":
      return (
        <svg aria-hidden="true" className={styles.navIcon} viewBox="0 0 24 24">
          <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7Z" />
          <path d="M18.5 12a6.8 6.8 0 0 0-.1-1l2-1.6-2-3.5-2.4 1a6.6 6.6 0 0 0-1.8-1L14 3.2h-4l-.2 2.7a6.6 6.6 0 0 0-1.8 1l-2.4-1-2 3.5 2 1.6a6.8 6.8 0 0 0 0 2l-2 1.6 2 3.5 2.4-1a6.6 6.6 0 0 0 1.8 1l.2 2.7h4l.2-2.7a6.6 6.6 0 0 0 1.8-1l2.4 1 2-3.5-2-1.6c.1-.3.1-.7.1-1Z" />
        </svg>
      );
  }
}
