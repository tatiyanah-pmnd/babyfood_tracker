import { queryOptions, useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { differenceInDays, differenceInMonths, parseISO } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";

export type Baby = Tables<"babies">;
export type FamilyRole = Tables<"family_members">["role"];

export const ROLE_LABELS: Record<FamilyRole, string> = {
  owner: "Propriétaire",
  parent: "Parent",
  caregiver: "Aidant",
  readonly: "Lecture seule",
};

export const babiesQuery = queryOptions({
  queryKey: ["babies"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("babies")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    return data;
  },
});

export const membershipsQuery = queryOptions({
  queryKey: ["memberships"],
  queryFn: async () => {
    const { data: u } = await supabase.auth.getUser();
    const { data, error } = await supabase
      .from("family_members")
      .select("family_id, role, families(name)")
      .eq("user_id", u.user!.id);
    if (error) throw error;
    return data;
  },
});

const KEY = "bft:selected-baby";

export function useSelectedBaby() {
  const { data: babies, isLoading } = useQuery(babiesQuery);
  const [id, setId] = useState<string | null>(null);
  useEffect(() => setId(localStorage.getItem(KEY)), []);
  const baby = babies?.find((b) => b.id === id) ?? babies?.[0] ?? null;
  const select = (next: string) => {
    localStorage.setItem(KEY, next);
    setId(next);
  };
  return { babies: babies ?? [], baby, select, isLoading };
}

/** Âge lisible en français, ex. « 7 mois et 12 jours ». */
export function formatAge(birthDate: string, now: Date = new Date()): string {
  const birth = parseISO(birthDate);
  if (now < birth) return "Pas encore né";
  const months = differenceInMonths(now, birth);
  if (months === 0) {
    const d = differenceInDays(now, birth);
    return `${d} jour${d > 1 ? "s" : ""}`;
  }
  if (months < 24) {
    const ref = new Date(birth);
    ref.setMonth(ref.getMonth() + months);
    const d = differenceInDays(now, ref);
    return d > 0 ? `${months} mois et ${d} jour${d > 1 ? "s" : ""}` : `${months} mois`;
  }
  const y = Math.floor(months / 12);
  const m = months % 12;
  return m ? `${y} ans et ${m} mois` : `${y} ans`;
}
