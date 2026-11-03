import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
export const invitationSchema = z.object({ family_id: z.string().uuid(), email: z.string().trim().email().max(255).transform(s => s.toLowerCase()), role: z.enum(["parent", "caregiver", "readonly"]) });
export const getEngagement = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).handler(async ({ context }) => {
  const { data: families, error } = await context.supabase.from("family_members").select("family_id,role,families(name)").eq("user_id", context.userId);
  if (error) throw new Error("Impossible de charger la famille.");
  const groups = await Promise.all((families ?? []).map(async f => { const members = await context.supabase.rpc("family_member_labels", { _family_id: f.family_id }); if (members.error) throw new Error("Impossible de charger les membres."); return { ...f, members: members.data }; }));
  const [invitations, reminders] = await Promise.all([context.supabase.from("family_invitations").select("*").order("created_at", { ascending: false }), context.supabase.from("reminders").select("*").order("due_at")]);
  if (invitations.error || reminders.error) throw new Error("Impossible de charger les rappels et invitations.");
  return { families: groups, invitations: invitations.data, reminders: reminders.data, userId: context.userId };
});
export const createInvitation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => invitationSchema.parse(input)).handler(async ({ data, context }) => {
  const { data: invitation, error } = await context.supabase.from("family_invitations").insert({ ...data, created_by: context.userId }).select("*").single();
  if (error) throw new Error("Invitation impossible. Seul le propriétaire peut inviter.");
  return invitation;
});
export const acceptInvitation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.string().uuid().parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.rpc("accept_family_invitation", { _token: data });
  if (result.error) throw new Error(result.error.message);
  return result.data;
});
export const revokeInvitation = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.string().uuid().parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from("family_invitations").update({ revoked_at: new Date().toISOString() }).eq("id", data).select("id").single();
  if (result.error) throw new Error("Révocation impossible."); return { ok: true };
});
export const changeMember = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid(), role: z.enum(["parent", "caregiver", "readonly", "remove"]) }).parse(input)).handler(async ({ data, context }) => {
  const result = data.role === "remove" ? await context.supabase.from("family_members").delete().eq("id", data.id).select("id").single() : await context.supabase.from("family_members").update({ role: data.role }).eq("id", data.id).select("id").single();
  if (result.error) throw new Error("Modification impossible. Seul le propriétaire peut gérer les accès."); return { ok: true };
});
export const saveReminder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ title: z.string().trim().min(1).max(120), due_at: z.string().datetime() }).parse(input)).handler(async ({ data, context }) => {
  const result = await context.supabase.from("reminders").insert({ ...data, user_id: context.userId }).select("id").single(); if (result.error) throw new Error("Rappel non enregistré."); return result.data;
});
export const updateReminder = createServerFn({ method: "POST" }).middleware([requireSupabaseAuth]).inputValidator((input: unknown) => z.object({ id: z.string().uuid(), action: z.enum(["complete", "reopen", "delete"]) }).parse(input)).handler(async ({ data, context }) => {
  const result = data.action === "delete" ? await context.supabase.from("reminders").delete().eq("id", data.id).select("id").single() : await context.supabase.from("reminders").update({ completed_at: data.action === "complete" ? new Date().toISOString() : null }).eq("id", data.id).select("id").single(); if (result.error) throw new Error("Modification du rappel impossible."); return { ok: true };
});