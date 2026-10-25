import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/observations")({
  head: () => ({
    meta: [
      { title: "Observations — BabyFood Tracker" },
      { name: "description", content: "Le suivi des observations" },
      { property: "og:title", content: "Observations — BabyFood Tracker" },
      { property: "og:description", content: "Le suivi des observations" },
    ],
  }),
  component: () => (
    <AppShell>
      <PageHeader title="Observations" />
      <ComingSoon title="Le suivi des observations" text="Peau, selles et commentaires, avec rappel le lendemain. Prochaine étape." />
    </AppShell>
  ),
});
