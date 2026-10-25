import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/aliments")({
  head: () => ({
    meta: [
      { title: "Aliments — BabyFood Tracker" },
      { name: "description", content: "La bibliothèque d'aliments" },
      { property: "og:title", content: "Aliments — BabyFood Tracker" },
      { property: "og:description", content: "La bibliothèque d'aliments" },
    ],
  }),
  component: () => (
    <AppShell>
      <PageHeader title="Aliments" />
      <ComingSoon title="La bibliothèque d'aliments" text="Plus de 60 aliments, conseils de préparation selon Santé publique France. Prochaine étape." />
    </AppShell>
  ),
});
