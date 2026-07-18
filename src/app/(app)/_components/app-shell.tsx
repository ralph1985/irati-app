"use client";

import { AnimatePresence, motion, useReducedMotion, type Variants } from "motion/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import styles from "./app-shell.module.css";

const tabs = [
  { href: "/", label: "Inicio" },
  { href: "/peso", label: "Peso" },
  { href: "/vacunas", label: "Vacunas" },
  { href: "/viaje", label: "Viaje" },
  { href: "/ajustes", label: "Ajustes" },
] as const;

const tabOrder = new Map<string, number>(tabs.map((tab, index) => [tab.href, index]));

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

function getOffset(direction: Direction, phase: "enter" | "exit"): string {
  if (direction === "none") {
    return "0%";
  }

  if (phase === "enter") {
    return direction === "forward" ? "100%" : "-100%";
  }

  return direction === "forward" ? "-100%" : "100%";
}
