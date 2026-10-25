import { createFileRoute, Navigate } from "@tanstack/react-router";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { AppShell, PageHeader } from "@/components/AppShell";
import { BabySwitcher } from "@/components/BabySwitcher";
import { formatAge, useSelectedBaby } from "@/lib/babies";
import { Skeleton } from "@/components/ui/skeleton";

export const Route = createFileRoute("/_authenticated/accueil")({
  head: () => ({
    meta: [
      { title: "Accueil — BabyFood Tracker" },
      { name: "description", content: "La journée de bébé en un coup d'œil." },
      { property: "og:title", content: "Accueil — BabyFood Tracker" },
      { property: "og:description", content: "Tableau de bord de la diversification." },
    ],
  }),
  component: Home,
});

function Home() {
  const { baby, babies, select, isLoading } = useSelectedBaby();
  if (isLoading) return <AppShell><Skeleton className="h-40 rounded-3xl" /></AppShell>;
  if (!baby) return <Navigate to="/bienvenue" />;

  const today = format(new Date(), "EEEE d MMMM", { locale: fr });
  return (
    <AppShell>
      <PageHeader eyebrow={today} title={`Bonjour ${baby.first_name}`} action={<BabySwitcher babies={babies} current={baby} onSelect={select} />} />
      <section className="rounded-3xl bg-hero p-6 shadow-soft">
        <p className="text-sm text-muted-foreground">Âge</p>
        <p className="mt-1 font-display text-3xl">{formatAge(baby.birth_date)}</p>
        {baby.diversification_start && (
          <p className="mt-3 text-sm text-muted-foreground">
            Diversification commencée le {format(new Date(baby.diversification_start), "d MMMM yyyy", { locale: fr })}
          </p>
        )}
      </section>
      <section className="mt-6 grid gap-4 sm:grid-cols-2">
        {["Aliments découverts", "Nouveaux cette semaine", "Observations avec symptômes", "Repas du jour"].map((k) => (
          <div key={k} className="rounded-3xl bg-card p-5 shadow-soft">
            <p className="text-sm text-muted-foreground">{k}</p>
            <p className="mt-2 font-display text-3xl">0</p>
          </div>
        ))}
      </section>
      <p className="mt-6 text-center text-xs text-muted-foreground">
        Les statistiques se rempliront dès l'ajout du journal des repas (prochaine étape).
      </p>
    </AppShell>
  );
}
