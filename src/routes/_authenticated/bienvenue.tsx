import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BabyForm } from "@/components/BabyForm";
import { membershipsQuery } from "@/lib/babies";

export const Route = createFileRoute("/_authenticated/bienvenue")({
  head: () => ({
    meta: [
      { title: "Bienvenue — BabyFood Tracker" },
      { name: "description", content: "Créez le profil de votre bébé." },
      { property: "og:title", content: "Bienvenue — BabyFood Tracker" },
      { property: "og:description", content: "Premiers pas dans BabyFood Tracker." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Welcome,
});

function Welcome() {
  const navigate = useNavigate();
  const { data } = useQuery(membershipsQuery);
  const own = data?.find((m) => m.role === "owner") ?? data?.[0];
  return (
    <div className="min-h-screen bg-hero px-6 py-10">
      <div className="mx-auto max-w-md">
        <p className="font-display text-xl">BabyFood</p>
        <h1 className="mt-12 font-display text-4xl">Faisons connaissance</h1>
        <p className="mt-3 text-muted-foreground">
          Quelques informations pour personnaliser le suivi. Vous pourrez les modifier à tout moment.
        </p>
        <div className="mt-8 rounded-3xl bg-card p-6 shadow-soft">
          {own ? (
            <BabyForm familyId={own.family_id} submitLabel="Commencer" onSaved={(b) => { localStorage.setItem("bft:selected-baby", b.id); navigate({ to: "/accueil" }); }} />
          ) : (
            <p className="text-sm text-muted-foreground">Chargement…</p>
          )}
        </div>
      </div>
    </div>
  );
}
