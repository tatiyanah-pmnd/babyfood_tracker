import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { mealSchema, observationSchema } from "./tracking-schema";
import { FOODS } from "./foods";

export const getTracking = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const results = await Promise.all([
    context.supabase.from("meals").select("*").order("meal_date", { ascending: false }).order("meal_time", { ascending: false }),
    context.supabase.from("observations").select("*").order("observed_at", { ascending: false }),
    context.supabase.from("baby_food_statuses").select("*"),
    context.supabase.from("family_members").select("family_id,role").eq("user_id", context.userId),
  ]);
  for (const r of results) if (r.error) throw new Error("Impossible de charger le suivi. Réessayez.");
  return { meals: results[0].data ?? [], observations: results[1].data ?? [], statuses: results[2].data ?? [], memberships: results[3].data ?? [], foods: FOODS };
});
export const saveMeal = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => mealSchema.parse(input)).handler(async ({ data, context }) => {
  const { id, ...values } = data;
  const result = id ? await context.supabase.from("meals").update(values).eq("id", id).eq("baby_id", values.baby_id).select("id").single() : await context.supabase.from("meals").insert({ ...values, created_by: context.userId }).select("id").single();
  if (result.error) throw new Error("Le repas n’a pas été enregistré. Vérifiez vos droits puis réessayez.");
  return result.data;
});
export const saveObservation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => observationSchema.parse(input)).handler(async ({ data, context }) => {
  const { id, ...values } = data;
  const result = id ? await context.supabase.from("observations").update(values).eq("id", id).eq("baby_id", values.baby_id).select("id").single() : await context.supabase.from("observations").insert({ ...values, created_by: context.userId }).select("id").single();
  if (result.error) throw new Error("L’observation n’a pas été enregistrée. Vérifiez vos droits puis réessayez.");
  return result.data;
});
export const deleteEntry = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ table: z.enum(["meals", "observations"]), id: z.string().uuid(), baby_id: z.string().uuid() }).parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from(data.table).delete().eq("id", data.id).eq("baby_id", data.baby_id).select("id").single();
  if (result.error) throw new Error("Suppression impossible. Vérifiez vos droits puis réessayez.");
  return { ok: true };
});
export const setFoodStatus = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ baby_id: z.string().uuid(), food_id: z.string().refine(id => FOODS.some(f => f.id === id)), status: z.enum(["unseen", "discovered", "planned", "review"]) }).parse(input)).handler(async ({ data, context }) => {
  const result = data.status === "unseen" ? await context.supabase.from("baby_food_statuses").delete().eq("baby_id", data.baby_id).eq("food_id", data.food_id) : await context.supabase.from("baby_food_statuses").upsert({ baby_id: data.baby_id, food_id: data.food_id, status: data.status });
  if (result.error) throw new Error("Le statut n’a pas été enregistré.");
  return { ok: true };
});