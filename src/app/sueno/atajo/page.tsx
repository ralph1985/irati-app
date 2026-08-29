import { hasValidSession } from "@/modules/auth/infrastructure/server-auth";
import { LoginScreen } from "@/modules/auth/ui/login-screen";
import { isSleepKind } from "@/modules/sleep/domain/sleep-entry";
import { QuickSleepView } from "@/modules/sleep/ui/quick-sleep-view";

export default async function QuickSleepPage({
  searchParams,
}: {
  searchParams: Promise<{ tipo?: string }>;
}) {
  if (!(await hasValidSession())) {
    return <LoginScreen />;
  }

  const { tipo } = await searchParams;
  const kind = tipo === "noche" ? "night" : tipo && isSleepKind(tipo) ? tipo : "nap";

  return <QuickSleepView kind={kind} />;
}
