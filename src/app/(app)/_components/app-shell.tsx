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

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  const [direction, setDirection] = useState<Direction>("none");

  useEffect(() => {
    setDirection(getDirection(previousPathname.current, pathname));
    previousPathname.current = pathname;
  }, [pathname]);

  return (
    <div className={styles.page}>
      <div className={styles.view} data-direction={direction} key={pathname}>
        {children}
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
