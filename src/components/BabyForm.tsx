import { useState, type FormEvent } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import type { Baby } from "@/lib/babies";

const schema = z.object({
  first_name: z.string().trim().min(1, "Le prénom est requis").max(60),
  birth_date: z.string().min(1, "La date de naissance est requise"),
  diversification_start: z.string().optional(),
  allergies: z.string().max(1000).optional(),
  notes: z.string().max(2000).optional(),
});

export function BabyForm({
  familyId,
  baby,
  onSaved,
  submitLabel = "Enregistrer",
}: {
  familyId: string;
  baby?: Baby | undefined;
  onSaved: (b: Baby) => void;
  submitLabel?: string;
}) {
  const qc = useQueryClient();
  const [v, setV] = useState({
    first_name: baby?.first_name ?? "",
    birth_date: baby?.birth_date ?? "",
    diversification_start: baby?.diversification_start ?? "",
    allergies: baby?.allergies ?? "",
    notes: baby?.notes ?? "",
  });
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof v) => (e: { target: { value: string } }) => setV({ ...v, [k]: e.target.value });

  async function submit(e: FormEvent) {
    e.preventDefault();
    const p = schema.safeParse(v);
    if (!p.success) return void toast.error(p.error.issues[0]?.message ?? "Formulaire invalide");
    const row = {
      first_name: p.data.first_name,
      birth_date: p.data.birth_date,
      diversification_start: p.data.diversification_start || null,
      allergies: p.data.allergies?.trim() || null,
      notes: p.data.notes?.trim() || null,
    };
    setBusy(true);
    const res = baby
      ? await supabase.from("babies").update(row).eq("id", baby.id).select().single()
      : await supabase.from("babies").insert({ ...row, family_id: familyId }).select().single();
    setBusy(false);
    if (res.error) return void toast.error("Enregistrement impossible. Vérifiez vos droits d'accès.");
    await qc.invalidateQueries({ queryKey: ["babies"] });
    toast.success(baby ? "Profil mis à jour" : "Profil créé");
    onSaved(res.data);
  }

  const field = "h-12 rounded-xl";
  return (
    <form onSubmit={submit} className="space-y-5">
      <div className="space-y-2">
        <Label htmlFor="fn">Prénom *</Label>
        <Input id="fn" value={v.first_name} onChange={set("first_name")} className={field} />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="bd">Date de naissance *</Label>
          <Input id="bd" type="date" value={v.birth_date} onChange={set("birth_date")} className={field} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ds">Début de la diversification</Label>
          <Input id="ds" type="date" value={v.diversification_start} onChange={set("diversification_start")} className={field} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="al">Allergies connues</Label>
        <Input id="al" value={v.allergies} onChange={set("allergies")} placeholder="Facultatif" className={field} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="no">Notes</Label>
        <Textarea id="no" value={v.notes} onChange={set("notes")} placeholder="Facultatif" className="rounded-xl" />
      </div>
      <Button disabled={busy} className="h-12 w-full rounded-full">{busy ? "Enregistrement…" : submitLabel}</Button>
    </form>
  );
}
