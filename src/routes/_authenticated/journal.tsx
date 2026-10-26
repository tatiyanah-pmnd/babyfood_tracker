import { createFileRoute, Navigate, type SearchSchemaInput } from "@tanstack/react-router";
import { useState } from "react";
import { format, parseISO, addDays, startOfWeek } from "date-fns";
import { fr } from "date-fns/locale";
import { Plus, Pencil, ChevronLeft, ChevronRight, CalendarDays } from "lucide-react";
import { AppShell, PageHeader } from "@/components/AppShell";
import { BabySwitcher } from "@/components/BabySwitcher";
import { MealForm } from "@/components/MealForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DeleteEntry, EmptyState, TrackingError, TrackingNotFound } from "@/components/TrackingShared";
import { loadTracking, useTracking, trackingHead } from "@/lib/tracking";
import type { Tables } from "@/integrations/supabase/types";
export const Route = createFileRoute("/_authenticated/journal")({
  validateSearch: (s: SearchSchemaInput & { date?: unknown; view?: unknown; add?: unknown }) => ({ date: typeof s["date"] === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s["date"]) && !Number.isNaN(Date.parse(s["date"])) && new Date(s["date"]).toISOString().slice(0, 10) === s["date"] ? s["date"] : format(new Date(), "yyyy-MM-dd"), view: s["view"] === "history" ? "history" : "day", add: s["add"] === true || s["add"] === "true" }),
  loader: ({ context }) => loadTracking(context.queryClient),
  head: () => trackingHead("Journal", "Le journal des déjeuners et goûters de bébé."), errorComponent: TrackingError, notFoundComponent: TrackingNotFound, component: Journal,
});
function Journal() {
  const t = useTracking(); const search = Route.useSearch(); const navigate = Route.useNavigate();
  const [editing, setEditing] = useState<Tables<"meals"> | null>(null);
  if (!t.baby) return <Navigate to="/bienvenue" />;
  const baby = t.baby; const day = parseISO(search.date); const week = startOfWeek(day, { weekStartsOn: 1 });
  const meals = search.view === "history" ? t.meals : t.meals.filter(m => m.meal_date === search.date);
  const changeDate = (date: string) => navigate({ search: prev => ({ ...prev, date }) });
  return <AppShell showFab={false}><PageHeader title="Journal" eyebrow="Les petites découvertes du quotidien" action={<BabySwitcher babies={t.babies} current={baby} onSelect={t.select} />} />
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3"><div className="flex gap-1"><Button variant={search.view === "day" ? "secondary" : "ghost"} onClick={() => navigate({ search: p => ({ ...p, view: "day" }) })}><CalendarDays />Calendrier</Button><Button variant={search.view === "history" ? "secondary" : "ghost"} onClick={() => navigate({ search: p => ({ ...p, view: "history" }) })}>Historique</Button></div>{t.canEdit && <Button onClick={() => navigate({ search: p => ({ ...p, add: true }) })}><Plus />Ajouter un repas</Button>}</div>
    {search.view === "day" && <section className="mb-8 border-y py-5"><div className="flex items-center justify-between gap-2"><Button variant="ghost" size="icon" aria-label="Jour précédent" onClick={() => changeDate(format(addDays(day, -1), "yyyy-MM-dd"))}><ChevronLeft /></Button><Input aria-label="Date du journal" type="date" className="max-w-48" value={search.date} onChange={e => { if (e.target.value) changeDate(e.target.value); }} /><Button variant="ghost" size="icon" aria-label="Jour suivant" onClick={() => changeDate(format(addDays(day, 1), "yyyy-MM-dd"))}><ChevronRight /></Button></div><div className="mt-4 grid grid-cols-7 gap-1">{Array.from({ length: 7 }, (_, i) => { const d = addDays(week, i); const key = format(d, "yyyy-MM-dd"); const count = t.meals.filter(m => m.meal_date === key).length; return <Button key={key} className="h-20 min-w-0 flex-col gap-1 px-0" variant={key === search.date ? "default" : "ghost"} aria-label={format(d, "EEEE d MMMM", { locale: fr })} onClick={() => changeDate(key)}><span className="text-xs capitalize">{format(d, "EEE", { locale: fr })}</span><span>{format(d, "d")}</span><span className="text-xs">{count ? `${count} repas` : "·"}</span></Button>; })}</div></section>}
    {meals.length === 0 ? <EmptyState title="Une page encore blanche" text={search.view === "day" ? "Aucun repas noté pour cette journée." : "Aucun repas noté pour ce bébé."} /> : <div className="space-y-4">{meals.map(m => <article key={m.id} className="rounded-xl border bg-card p-5"><div className="flex items-start justify-between gap-2"><div><p className="text-xs text-muted-foreground">{format(parseISO(m.meal_date), "EEEE d MMMM yyyy", { locale: fr })} · {m.meal_time.slice(0, 5)}</p><h2 className="mt-1 font-display text-xl">{m.kind === "lunch" ? "Déjeuner" : "Goûter"}</h2></div>{t.canEdit && <div className="flex"><Button variant="ghost" size="icon" aria-label="Modifier le repas" title="Modifier" onClick={() => setEditing(m)}><Pencil /></Button><DeleteEntry table="meals" id={m.id} babyId={baby.id} /></div>}</div>{m.dish && <p className="mt-4 font-medium">{m.dish}</p>}{m.dessert && <p className="mt-1 text-sm text-muted-foreground">Dessert · {m.dessert}</p>}<div className="mt-4 flex flex-wrap gap-2">{m.ingredients.map(i => <span key={i} className="rounded-md bg-sage-soft px-2 py-1 text-xs">{i}</span>)}</div>{m.notes && <p className="mt-3 whitespace-pre-wrap text-sm text-muted-foreground">{m.notes}</p>}</article>)}</div>}
    {(search.add || editing) && t.canEdit && <MealForm key={`${baby.id}-${editing?.id ?? "new"}`} babyId={baby.id} initial={editing ?? undefined} date={search.date} onClose={() => { setEditing(null); navigate({ search: p => ({ ...p, add: false }) }); }} />}
  </AppShell>;
}
