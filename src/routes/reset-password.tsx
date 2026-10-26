import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Nouveau mot de passe — BabyFood Tracker" },
      { name: "description", content: "Choisissez un nouveau mot de passe." },
      { property: "og:title", content: "Nouveau mot de passe — BabyFood Tracker" },
      { property: "og:description", content: "Réinitialisation du mot de passe." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ResetPage,
});

function ResetPage() {
  const navigate = useNavigate();
  const [pw, setPw] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (pw.length < 8) return void toast.error("8 caractères minimum");
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password: pw });
    setBusy(false);
    if (error) return void toast.error("Lien expiré ou invalide. Recommencez la procédure.");
    toast.success("Mot de passe mis à jour");
    navigate({ to: "/accueil" });
  }

  return (
    <div className="min-h-screen bg-hero px-6 py-10">
      <form onSubmit={submit} className="mx-auto mt-20 max-w-sm space-y-4 rounded-3xl bg-card p-7 shadow-soft">
        <h1 className="font-display text-3xl">Nouveau mot de passe</h1>
        <div className="space-y-2">
          <Label htmlFor="pw">Mot de passe</Label>
          <Input id="pw" type="password" autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} className="h-12 rounded-xl" />
        </div>
        <Button disabled={busy} className="h-12 w-full rounded-full">Enregistrer</Button>
      </form>
    </div>
  );
}
