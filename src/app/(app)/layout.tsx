import { ReactNode } from "react";
import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { AppShell } from "./_components/app-shell";

export default async function AppLayout({ children }: { children: ReactNode }) {
  if (!(await hasValidSession())) {
    return children;
  }

  return <AppShell>{children}</AppShell>;
}
