import { createFileRoute } from "@tanstack/react-router";
import { AppShell, ComingSoon, PageHeader } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({
    meta: [
      { title: "Journal — BabyFood Tracker" },
      { name: "description", content: "Le journal des repas" },
      { property: "og:title", content: "Journal — BabyFood Tracker" },
      { property: "og:description", content: "Le journal des repas" },
    ],
  }),
  component: () => (
    <AppShell>
      <PageHeader title="Journal" />
      <ComingSoon title="Le journal des repas" text="Déjeuner (plat, dessert) et goûter, avec ingrédients et photos. Prochaine étape du développement." />
    </AppShell>
  ),
});
