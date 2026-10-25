import { startOfWeek, format } from "date-fns";
import { FOODS, normalizeFood, type FoodStatus } from "./foods";
export type MealSummary = { ingredients: string[]; meal_date: string };
export type StatusSummary = { food_id: string; status: string; updated_at: string };
export function foodStatus(foodId: string, meals: MealSummary[], statuses: StatusSummary[]): FoodStatus {
  const explicit = statuses.find(s => s.food_id === foodId);
  if (explicit && (explicit.status === "planned" || explicit.status === "review" || explicit.status === "discovered")) return explicit.status;
  const food = FOODS.find(f => f.id === foodId);
  return food && meals.some(m => m.ingredients.some(i => normalizeFood(i) === normalizeFood(food.name))) ? "discovered" : "unseen";
}
export function discoveryDates(meals: MealSummary[], statuses: StatusSummary[]) {
  const dates = new Map<string, string>();
  for (const meal of meals) for (const ingredient of meal.ingredients) {
    const food = FOODS.find(f => normalizeFood(f.name) === normalizeFood(ingredient));
    if (food && (!dates.has(food.id) || meal.meal_date < (dates.get(food.id) ?? ""))) dates.set(food.id, meal.meal_date);
  }
  for (const status of statuses) if (status.status === "discovered" && !dates.has(status.food_id)) dates.set(status.food_id, status.updated_at.slice(0, 10));
  return dates;
}
export function dashboardStats(meals: MealSummary[], statuses: StatusSummary[], observations: { no_reaction: boolean; skin: string; stool: string }[], now = new Date()) {
  const dates = discoveryDates(meals, statuses);
  const today = format(now, "yyyy-MM-dd");
  const week = format(startOfWeek(now, { weekStartsOn: 1 }), "yyyy-MM-dd");
  return { discovered: dates.size, newThisWeek: [...dates.values()].filter(d => d >= week && d <= today).length, symptoms: observations.filter(o => !o.no_reaction && Boolean(o.skin || o.stool)).length, todayMeals: meals.filter(m => m.meal_date === today).length, exploration: Math.round(dates.size / FOODS.length * 100) };
}