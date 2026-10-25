import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";

const search = z.object({ mode: z.enum(["signin", "signup", "forgot"]).catch("signin") });

export const Route = createFileRoute("/auth")({
  validateSearch: search,
  head: () => ({
    meta: [
      { title: "Connexion — BabyFood Tracker" },
      { name: "description", content: "Connectez-vous ou créez votre compte BabyFood Tracker." },
      { property: "og:title", content: "Connexion — BabyFood Tracker" },
      { property: "og:description", content: "Accédez au carnet de diversification de votre bébé." },
    ],
  }),
  component: AuthPage,
});

const credsSchema = z.object({
  email: z.string().trim().email("Adresse e-mail invalide").max(255),
  password: z.string().min(8, "8 caractères minimum").max(72),
});

function AuthPage() {
  const { mode } = Route.useSearch();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState<string | null>(null);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "forgot") {
        const r = z.string().trim().email().safeParse(email);
        if (!r.success) return void toast.error("Adresse e-mail invalide");
        const { error } = await supabase.auth.resetPasswordForEmail(r.data, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        setSent("Si un compte existe, un lien de réinitialisation vient d'être envoyé.");
        return;
      }
      const parsed = credsSchema.safeParse({ email, password });
      if (!parsed.success) return void toast.error(parsed.error.issues[0]?.message ?? "Formulaire invalide");
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          ...parsed.data,
          options: { emailRedirectTo: window.location.origin, data: { display_name: name.trim().slice(0, 60) } },
        });
        if (error) throw error;
        if (!data.session) setSent("Vérifiez votre boîte mail pour confirmer votre compte.");
        else navigate({ to: "/accueil" });
      } else {
        const { error } = await supabase.auth.signInWithPassword(parsed.data);
        if (error) throw new Error("E-mail ou mot de passe incorrect");
        navigate({ to: "/accueil" });
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Une erreur est survenue");
    } finally {
      setBusy(false);
    }
  }

  async function google() {
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) return void toast.error("Connexion Google impossible");
    if (r.redirected) return;
    navigate({ to: "/accueil" });
  }

  const title = mode === "signup" ? "Créer un compte" : mode === "forgot" ? "Mot de passe oublié" : "Bon retour";

  return (
    <div className="min-h-screen bg-hero px-6 py-10">
      <div className="mx-auto max-w-sm">
        <Link to="/" className="font-display text-xl">BabyFood</Link>
        <div className="mt-14 rounded-3xl bg-card p-7 shadow-soft">
          <h1 className="font-display text-3xl">{title}</h1>
          {sent ? (
            <p className="mt-4 text-sm text-muted-foreground">{sent}</p>
          ) : (
            <form onSubmit={submit} className="mt-6 space-y-4">
              {mode === "signup" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Votre prénom</Label>
                  <Input id="name" value={name} onChange={(e) => setName(e.target.value)} className="h-12 rounded-xl" />
                </div>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">E-mail</Label>
                <Input id="email" type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="h-12 rounded-xl" />
              </div>
              {mode !== "forgot" && (
                <div className="space-y-2">
                  <Label htmlFor="pw">Mot de passe</Label>
                  <Input id="pw" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} required value={password} onChange={(e) => setPassword(e.target.value)} className="h-12 rounded-xl" />
                </div>
              )}
              <Button type="submit" disabled={busy} className="h-12 w-full rounded-full">
                {busy ? "Un instant…" : mode === "signup" ? "Créer mon compte" : mode === "forgot" ? "Envoyer le lien" : "Se connecter"}
              </Button>
              {mode !== "forgot" && (
                <Button type="button" variant="outline" onClick={google} className="h-12 w-full rounded-full">
                  Continuer avec Google
                </Button>
              )}
            </form>
          )}
          <div className="mt-6 space-y-2 text-center text-sm text-muted-foreground">
            {mode === "signin" && (
              <>
                <p><Link to="/auth" search={{ mode: "forgot" }} className="underline">Mot de passe oublié ?</Link></p>
                <p>Pas encore de compte ? <Link to="/auth" search={{ mode: "signup" }} className="text-foreground underline">S'inscrire</Link></p>
              </>
            )}
            {mode !== "signin" && (
              <p>Déjà inscrit ? <Link to="/auth" search={{ mode: "signin" }} onClick={() => setSent(null)} className="text-foreground underline">Se connecter</Link></p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
