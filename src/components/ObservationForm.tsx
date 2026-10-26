import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";
import { saveObservation } from "@/lib/tracking.functions";
import { observationSchema, type ObservationInput } from "@/lib/tracking-schema";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Checkbox } from "./ui/checkbox";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { selectClass } from "./TrackingShared";
export function ObservationForm({ babyId, meals, initial, onClose }: { babyId: string; meals: Tables<"meals">[]; initial?: Tables<"observations">; onClose: () => void }) {
  const [values, setValues] = useState({ meal_id: initial?.meal_id ?? "", no_reaction: initial?.no_reaction ?? false, skin: initial?.skin ?? "", stool: initial?.stool ?? "", notes: initial?.notes ?? "", time: format(initial ? new Date(initial.observed_at) : new Date(), "yyyy-MM-dd'T'HH:mm") });
  const [error, setError] = useState(""); const client = useQueryClient(); const save = useServerFn(saveObservation);
  const mutation = useMutation({ mutationFn: (data: ObservationInput) => save({ data }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["tracking"] }); toast.success("Observation enregistrée"); onClose(); }, onError: () => setError("L’observation n’a pas été enregistrée. Réessayez.") });
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto"><DialogTitle>{initial ? "Modifier l’observation" : "Ajouter une observation"}</DialogTitle><DialogDescription>Ces notes n’établissent aucun diagnostic ni lien avec un aliment.</DialogDescription><form className="space-y-4" onSubmit={e => { e.preventDefault(); const observed = new Date(values.time); if (Number.isNaN(observed.getTime())) { setError("Date invalide"); return; } const parsed = observationSchema.safeParse({ id: initial?.id, baby_id: babyId, meal_id: values.meal_id || null, observed_at: observed.toISOString(), no_reaction: values.no_reaction, skin: values.skin, stool: values.stool, notes: values.notes }); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Vérifiez les champs"); return; } setError(""); mutation.mutate(parsed.data); }}>
    <div><Label htmlFor="observed-time">Date et heure</Label><Input id="observed-time" type="datetime-local" required value={values.time} onChange={e => setValues(v => ({ ...v, time: e.target.value }))} /></div>
    <div><Label htmlFor="observed-meal">Repas associé (facultatif)</Label><select id="observed-meal" className={selectClass} value={values.meal_id} onChange={e => setValues(v => ({ ...v, meal_id: e.target.value }))}><option value="">Sans repas associé</option>{meals.map(m => <option key={m.id} value={m.id}>{m.meal_date} · {m.kind === "lunch" ? "Déjeuner" : "Goûter"} · {m.dish || m.dessert}</option>)}</select></div>
    <div className="flex items-center gap-3 rounded-md bg-sage-soft p-4"><Checkbox id="no-reaction" checked={values.no_reaction} onCheckedChange={checked => setValues(v => ({ ...v, no_reaction: checked === true, skin: checked ? "" : v.skin, stool: checked ? "" : v.stool }))} /><Label htmlFor="no-reaction">Aucune réaction observée</Label></div>
    {!values.no_reaction && <><div><Label htmlFor="skin">Peau</Label><Textarea id="skin" maxLength={500} placeholder="Description de ce que vous observez" value={values.skin} onChange={e => setValues(v => ({ ...v, skin: e.target.value }))} /></div><div><Label htmlFor="stool">Selles</Label><Textarea id="stool" maxLength={500} value={values.stool} onChange={e => setValues(v => ({ ...v, stool: e.target.value }))} /></div></>}
    <div><Label htmlFor="observation-notes">Commentaires</Label><Textarea id="observation-notes" maxLength={2000} value={values.notes} onChange={e => setValues(v => ({ ...v, notes: e.target.value }))} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Enregistrement…" : "Enregistrer l’observation"}</Button>
  </form></DialogContent></Dialog>;
}