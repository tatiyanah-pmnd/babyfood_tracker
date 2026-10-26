import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { CalendarDays, Leaf, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "BabyFood Tracker — la diversification alimentaire, sereinement" },
      { name: "description", content: "Notez les repas de bébé, suivez les aliments découverts et les observations, en famille." },
      { property: "og:title", content: "BabyFood Tracker" },
      { property: "og:description", content: "Le carnet élégant de la diversification alimentaire de bébé." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: async () => {
    if (typeof window === "undefined") return;
    const { data } = await supabase.auth.getSession();
    if (data.session) throw redirect({ to: "/accueil" });
  },
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-hero">
      <div className="mx-auto flex min-h-screen max-w-xl flex-col px-6 py-10">
        <p className="font-display text-xl">BabyFood</p>
        <div className="my-auto py-16">
          <h1 className="font-display text-5xl leading-[1.05] md:text-6xl">
            Chaque première bouchée, notée avec soin.
          </h1>
          <p className="mt-5 text-lg text-muted-foreground">
            Repas, aliments découverts, observations : le carnet de diversification à partager en famille.
          </p>
          <div className="mt-10 flex flex-col gap-3 sm:flex-row">
            <Button asChild size="lg" className="h-12 rounded-full px-8">
              <Link to="/auth" search={{ mode: "signup" }}>Créer un compte</Link>
            </Button>
            <Button asChild size="lg" variant="ghost" className="h-12 rounded-full px-8">
              <Link to="/auth" search={{ mode: "signin" }}>Se connecter</Link>
            </Button>
          </div>
        </div>
        <ul className="grid gap-4 text-sm text-muted-foreground sm:grid-cols-3">
          <li className="flex items-center gap-2"><CalendarDays className="h-4 w-4" strokeWidth={1.75} /> Repas en 30 secondes</li>
          <li className="flex items-center gap-2"><Leaf className="h-4 w-4" strokeWidth={1.75} /> Aliments découverts</li>
          <li className="flex items-center gap-2"><ShieldCheck className="h-4 w-4" strokeWidth={1.75} /> Données privées</li>
        </ul>
      </div>
    </div>
  );
}
