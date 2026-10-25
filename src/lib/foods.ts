export const FOOD_SOURCE = "https://www.santepubliquefrance.fr/nutrition-et-activite-physique/depliantflyer/nouvelles-recommandations-pour-la-diversification-alimentaire-des-enfants-de-moins-de-3-ans";
export const GROUPS = ["Légumes", "Fruits", "Féculents", "Légumineuses", "Viandes et œufs", "Poissons", "Produits laitiers", "Matières grasses"] as const;
export type Food = { id: string; name: string; group: string; allergen: string | null; preparation: string };
const lists = [
  "Carotte|Courgette|Brocoli|Chou-fleur|Haricot vert|Petit pois|Épinard|Potiron|Butternut|Poireau|Navet|Betterave|Patate douce|Aubergine|Tomate|Fenouil|Panais|Artichaut|Asperge|Concombre|Champignon|Endive",
  "Pomme|Poire|Banane|Pêche|Abricot|Prune|Fraise|Framboise|Myrtille|Mangue|Kiwi|Melon|Pastèque|Clémentine|Orange|Nectarine|Avocat|Cerise|Raisin|Ananas",
  "Pomme de terre|Riz|Pâtes|Semoule|Avoine|Quinoa|Polenta|Pain|Boulgour|Sarrasin",
  "Lentille corail|Lentille verte|Pois chiche|Haricot blanc|Haricot rouge|Pois cassé",
  "Poulet|Dinde|Bœuf|Veau|Agneau|Porc|Œuf",
  "Saumon|Cabillaud|Colin|Sardine|Truite|Lieu",
  "Yaourt nature|Fromage blanc|Petit-suisse|Emmental",
  "Huile de colza|Huile d’olive|Huile de noix|Beurre|Purée d’amande|Purée d’arachide",
];
const preparations = [
  "Laver, cuire jusqu’à tendreté puis mixer ou écraser selon les capacités de bébé. Éviter les morceaux durs.",
  "Laver, retirer noyaux et pépins. Proposer cuit ou bien mûr, mixé ou écrasé. Ne pas donner de raisins ou de fruits ronds entiers.",
  "Cuire jusqu’à une texture tendre puis adapter la texture aux capacités de bébé.",
  "Cuire soigneusement jusqu’à tendreté puis mixer ou écraser.",
  "Cuire à cœur, retirer les os et hacher finement. Cuire complètement les œufs.",
  "Cuire à cœur, retirer soigneusement toutes les arêtes et émietter.",
  "Choisir des produits nature au lait pasteurisé. Ils ne remplacent pas le lait habituel de bébé.",
  "Ajouter à la préparation. Pour les fruits à coque et l’arachide, uniquement une purée lisse diluée, jamais entiers.",
];
export const FOODS: Food[] = lists.flatMap((list, index) => list.split("|").map((name) => ({
  id: name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-"),
  name, group: GROUPS[index] ?? "", preparation: preparations[index] ?? "",
  allergen: ["Pâtes", "Semoule", "Pain", "Boulgour"].includes(name) ? "Blé (gluten)" : name === "Avoine" ? "Gluten possible : vérifier l’étiquette" : name === "Œuf" ? "Œuf" : index === 5 ? "Poisson" : index === 6 || name === "Beurre" ? "Lait" : ["Huile de noix", "Purée d’amande"].includes(name) ? "Fruits à coque" : name === "Purée d’arachide" ? "Arachide" : null,
})));
export const STATUS_LABELS = { unseen: "À découvrir", planned: "À proposer", discovered: "Découvert", review: "À discuter avec un professionnel" };
export type FoodStatus = keyof typeof STATUS_LABELS;
export function normalizeFood(value: string) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim(); }