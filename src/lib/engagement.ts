import { queryOptions } from "@tanstack/react-query";
import { getEngagement } from "./engagement.functions";
export const engagementQuery = queryOptions({ queryKey: ["engagement"], queryFn: () => getEngagement() });
export function invitationState(invitation: { accepted_at: string | null; revoked_at: string | null; expires_at: string }, now = new Date()) { return invitation.revoked_at ? "Révoquée" : invitation.accepted_at ? "Acceptée" : new Date(invitation.expires_at) <= now ? "Expirée" : "En attente"; }