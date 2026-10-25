import { queryOptions, useSuspenseQuery } from "@tanstack/react-query";
import { getTracking } from "./tracking.functions";
import { babiesQuery, useSelectedBaby } from "./babies";
import type { QueryClient } from "@tanstack/react-query";
export const trackingQuery = queryOptions({ queryKey: ["tracking"], queryFn: () => getTracking(), staleTime: 30_000 });
export async function loadTracking(queryClient: QueryClient) {
  await Promise.all([queryClient.ensureQueryData(trackingQuery), queryClient.ensureQueryData(babiesQuery)]);
}
export function useTracking() {
  const selected = useSelectedBaby();
  const { data } = useSuspenseQuery(trackingQuery);
  const babyId = selected.baby?.id;
  return { ...selected, foods: data.foods, meals: data.meals.filter(m => m.baby_id === babyId), observations: data.observations.filter(o => o.baby_id === babyId), statuses: data.statuses.filter(s => s.baby_id === babyId), canEdit: data.memberships.some(m => m.family_id === selected.baby?.family_id && m.role !== "readonly") };
}
export function trackingHead(title: string, description: string) { return { meta: [{ title: `${title} — BabyFood Tracker` }, { name: "description", content: description }, { property: "og:title", content: `${title} — BabyFood Tracker` }, { property: "og:description", content: description }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }; }