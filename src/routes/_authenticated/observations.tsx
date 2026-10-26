import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useState } from "react";
import { format } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Pencil, Check, TriangleAlert } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { BabySwitcher } from "@/components/BabySwitcher";
import { ObservationForm } from "@/components/ObservationForm";
import { Button } from "@/components/ui/button";
import { EmptyState, DeleteEntry, TrackingError, TrackingNotFound, selectClass } from "@/components/TrackingShared";
import { loadTracking, useTracking, trackingHead } from "@/lib/tracking";
import type { Tables } from "@/integrations/supabase/types";
export const Route = createFileRoute("/_authenticated/observations")({
  validateSearch: (s: Record<string, unknown>) => ({ filter: s.filter === "symptoms" || s.filter === "none" ? s.filter : "all" }),
  loader: ({ context }) => loadTracking(context.queryClient), head: () => trackingHead("Observations", "Notes de peau, selles et commentaires, sans diagnostic."), errorComponent: TrackingError, notFoundComponent: TrackingNotFound, component: Observations,
});
function Observations() {
  const t = useTracking(); const search = Route.useSearch(); const navigate = Route.useNavigate(); const [open, setOpen] = useState(false); const [editing, setEditing] = useState<Tables<"observations"> | null>(null);
  if (!t.baby) return <Navigate to="/bienvenue" />; const baby = t.baby;
  const observations = t.observations.filter(o => search.filter === "all" || (search.filter === "none" ? o.no_reaction : !o.no_reaction && Boolean(o.skin || o.stool)));
  return <AppShell showFab={false}><PageHeader title="Observations" eyebrow="Noter, sans interpréter" action={<BabySwitcher babies={t.babies} current={baby} onSelect={t.select} />} />
    <section className="mb-7 border-l-4 border-destructive bg-warning p-4 text-warning-foreground"><div className="flex items-center gap-2 font-medium"><TriangleAlert className="h-5 w-5" />En cas de signe grave</div><p className="mt-2 text-sm">Difficulté à respirer, gonflement du visage ou malaise : appelez immédiatement le 15 ou le 112.</p><div className="mt-3 flex gap-2"><Button asChild variant="outline"><a href="tel:15">Appeler le 15</a></Button><Button asChild variant="outline"><a href="tel:112">Appeler le 112</a></Button></div></section>
    <p className="mb-6 text-sm text-muted-foreground">Une observation ne permet pas de diagnostiquer une allergie ni d’attribuer un symptôme à un aliment. En cas de doute, demandez conseil à un professionnel de santé.</p>
    <div className="mb-6 flex flex-wrap justify-between gap-3"><select aria-label="Filtrer les observations" className={`${selectClass} max-w-64`} value={search.filter} onChange={e => navigate({ search: { filter: e.target.value === "none" || e.target.value === "symptoms" ? e.target.value : "all" } })}><option value="all">Toutes les observations</option><option value="symptoms">Avec symptômes décrits</option><option value="none">Aucune réaction observée</option></select>{t.canEdit && <Button onClick={() => setOpen(true)}><Plus />Ajouter une observation</Button>}</div>
    {!observations.length ? <EmptyState title="Rien de noté pour le moment" text="Les observations de ce bébé apparaîtront ici." /> : <div className="space-y-4">{observations.map(o => { const meal = t.meals.find(m => m.id === o.meal_id); return <article key={o.id} className="rounded-xl border bg-card p-5"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">{format(new Date(o.observed_at), "d MMMM yyyy · HH:mm", { locale: fr })}</p><h2 className="mt-2 flex items-center gap-2 font-display text-xl">{o.no_reaction && <Check className="h-5 w-5" />}{o.no_reaction ? "Aucune réaction observée" : "Observation"}</h2></div>{t.canEdit && <div className="flex"><Button variant="ghost" size="icon" aria-label="Modifier l’observation" onClick={() => setEditing(o)}><Pencil /></Button><DeleteEntry table="observations" id={o.id} babyId={baby.id} /></div>}</div>{meal && <p className="mt-3 text-xs text-muted-foreground">Repas associé · {meal.dish || meal.dessert} · {meal.meal_date}</p>}{o.skin && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Peau : </strong>{o.skin}</p>}{o.stool && <p className="mt-3 whitespace-pre-wrap text-sm"><strong>Selles : </strong>{o.stool}</p>}{o.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{o.notes}</p>}</article>; })}</div>}
    {(open || editing) && t.canEdit && <ObservationForm key={`${baby.id}-${editing?.id ?? "new"}`} babyId={baby.id} meals={t.meals} initial={editing ?? undefined} onClose={() => { setOpen(false); setEditing(null); }} />}
  </AppShell>;
}
