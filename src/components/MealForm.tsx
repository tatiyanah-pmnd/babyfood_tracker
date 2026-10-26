import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { format } from "date-fns";
import { X, Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { Textarea } from "./ui/textarea";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "./ui/dialog";
import { FOODS, normalizeFood } from "@/lib/foods";
import { saveMeal } from "@/lib/tracking.functions";
import { mealSchema, type MealInput } from "@/lib/tracking-schema";
import type { Tables } from "@/integrations/supabase/types";
export function MealForm({ babyId, initial, date, onClose }: { babyId: string; initial?: Tables<"meals"> | undefined; date: string; onClose: () => void }) {
  const [values, setValues] = useState<MealInput>({ id: initial?.id, baby_id: babyId, meal_date: initial?.meal_date ?? date, meal_time: initial?.meal_time.slice(0, 5) ?? format(new Date(), "HH:mm"), kind: initial?.kind === "snack" ? "snack" : "lunch", dish: initial?.dish ?? "", dessert: initial?.dessert ?? "", ingredients: initial?.ingredients ?? [], notes: initial?.notes ?? "" });
  const [ingredient, setIngredient] = useState(""); const [error, setError] = useState("");
  const client = useQueryClient(); const save = useServerFn(saveMeal);
  const mutation = useMutation({ mutationFn: (input: MealInput) => save({ data: input }), onSuccess: async () => { await client.invalidateQueries({ queryKey: ["tracking"] }); toast.success("Repas enregistré"); onClose(); }, onError: () => setError("Le repas n’a pas été enregistré. Réessayez.") });
  function addIngredient(name = ingredient) { const food = FOODS.find(f => normalizeFood(f.name) === normalizeFood(name)); const value = food?.name ?? name.trim(); if (value && !values.ingredients.some(i => normalizeFood(i) === normalizeFood(value))) setValues(v => ({ ...v, ingredients: [...v.ingredients, value] })); setIngredient(""); }
  const matches = ingredient.trim() ? FOODS.filter(f => normalizeFood(f.name).includes(normalizeFood(ingredient)) && !values.ingredients.includes(f.name)).slice(0, 6) : [];
  return <Dialog open onOpenChange={open => { if (!open && !mutation.isPending) onClose(); }}><DialogContent className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto"><DialogTitle>{initial ? "Modifier le repas" : "Ajouter un repas"}</DialogTitle><DialogDescription>Déjeuner ou goûter</DialogDescription><form className="space-y-4" onSubmit={e => { e.preventDefault(); const parsed = mealSchema.safeParse(values); if (!parsed.success) { setError(parsed.error.issues[0]?.message ?? "Vérifiez les champs"); return; } setError(""); mutation.mutate(parsed.data); }}>
    <div className="grid grid-cols-2 gap-3"><div><Label htmlFor="meal-date">Date</Label><Input id="meal-date" type="date" required value={values.meal_date} onChange={e => setValues(v => ({ ...v, meal_date: e.target.value }))} /></div><div><Label htmlFor="meal-time">Heure</Label><Input id="meal-time" type="time" required value={values.meal_time} onChange={e => setValues(v => ({ ...v, meal_time: e.target.value }))} /></div></div>
    <div className="flex gap-2">{(["lunch", "snack"] as const).map(kind => <Button key={kind} type="button" variant={values.kind === kind ? "default" : "outline"} aria-pressed={values.kind === kind} onClick={() => setValues(v => ({ ...v, kind }))}>{kind === "lunch" ? "Déjeuner" : "Goûter"}</Button>)}</div>
    <div><Label htmlFor="dish">{values.kind === "lunch" ? "Plat" : "Goûter"}</Label><Input id="dish" maxLength={200} placeholder="Purée de carotte et pomme de terre" value={values.dish} onChange={e => setValues(v => ({ ...v, dish: e.target.value }))} /></div>
    <div><Label htmlFor="dessert">Dessert / fruit</Label><Input id="dessert" maxLength={200} placeholder="Compote de poire" value={values.dessert} onChange={e => setValues(v => ({ ...v, dessert: e.target.value }))} /></div>
    <div><Label htmlFor="ingredient">Ingrédients</Label><div className="flex gap-2"><Input id="ingredient" autoComplete="off" maxLength={100} value={ingredient} onChange={e => setIngredient(e.target.value)} onKeyDown={e => { if (e.key === "Enter") { e.preventDefault(); addIngredient(); } }} placeholder="Rechercher ou saisir un ingrédient" /><Button type="button" size="icon" aria-label="Ajouter l’ingrédient" disabled={!ingredient.trim()} onClick={() => addIngredient()}><Plus /></Button></div>{matches.length > 0 && <div className="mt-1 border bg-popover rounded-md">{matches.map(f => <Button className="w-full justify-start" variant="ghost" type="button" key={f.id} onClick={() => addIngredient(f.name)}>{f.name}</Button>)}</div>}<div className="mt-2 flex flex-wrap gap-2">{values.ingredients.map(i => <span key={i} className="inline-flex items-center gap-1 rounded-md bg-sage-soft pl-3 text-sm">{i}<Button type="button" size="icon" variant="ghost" aria-label={`Retirer ${i}`} onClick={() => setValues(v => ({ ...v, ingredients: v.ingredients.filter(x => x !== i) }))}><X /></Button></span>)}</div></div>
    <div><Label htmlFor="meal-notes">Notes</Label><Textarea id="meal-notes" maxLength={2000} value={values.notes} onChange={e => setValues(v => ({ ...v, notes: e.target.value }))} /></div>{error && <p role="alert" className="text-sm text-destructive">{error}</p>}<Button className="w-full" disabled={mutation.isPending}>{mutation.isPending ? "Enregistrement…" : "Enregistrer le repas"}</Button>
  </form></DialogContent></Dialog>;
}