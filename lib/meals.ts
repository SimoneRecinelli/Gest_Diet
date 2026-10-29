export type Alternative = { name: string; qty: number | string; unit: string };

export type DietItem = {
  meal_name: string;
  item_id: number;
  food_name: string;
  quantity_numeric: number | string;
  quantity_unit: string;
  is_cheat_meal: boolean;
  kcal?: number | string | null;
  food_category?: string | null;
  alternatives: Alternative[];
};

// Se un pasto ha il "Pasto libero a scelta", la riga generica "Pasto Libero (Budget...)" è ridondante
export function hideRedundantFreeMeal(items: DietItem[]): DietItem[] {
  if (!items.some(isFreeMealChooser)) return items;
  return items.filter((i) => isFreeMealChooser(i) || !/pasto\s+libero/i.test(i.food_name));
}

export type MealGroup = { name: string; items: DietItem[] };

// Mantiene l'ordine in cui l'API restituisce i pasti
export function groupByMeal(items: DietItem[]): MealGroup[] {
  const groups: MealGroup[] = [];
  for (const item of items) {
    const last = groups[groups.length - 1];
    const existing = last && last.name === item.meal_name ? last : groups.find((g) => g.name === item.meal_name);
    if (existing) existing.items.push(item);
    else groups.push({ name: item.meal_name, items: [item] });
  }
  return groups.map((g) => ({ ...g, items: hideRedundantFreeMeal(g.items) }));
}

export function mealKcal(items: DietItem[]): number {
  let total = 0;
  for (const item of items) {
    const n = Number(item.kcal);
    if (Number.isFinite(n) && n > 0) total += n;
  }
  return total;
}

// "Pasto libero a scelta": un record con più alternative da cui scegliere un menu
export function isFreeMealChooser(item: DietItem): boolean {
  return item.alternatives.length > 1 && /pasto\s+libero/i.test(item.food_name);
}

// Orario indicativo di inizio dei pasti, ricavato dal nome
const START_HOURS: [RegExp, number][] = [
  [/colazione/i, 7],
  [/spuntin/i, 10.5],
  [/pranzo/i, 13],
  [/merenda/i, 16.5],
  [/cena/i, 20],
];

function startHour(name: string): number | null {
  for (const [pattern, hour] of START_HOURS) {
    if (pattern.test(name)) return hour;
  }
  return null;
}

// Il primo pasto che deve ancora iniziare (o è iniziato da meno di un'ora)
export function nextMealName(names: string[], hour: number): string | null {
  let best: { name: string; hour: number } | null = null;
  for (const name of names) {
    const h = startHour(name);
    if (h === null || h < hour - 1) continue;
    if (best === null || h < best.hour) best = { name, hour: h };
  }
  return best?.name ?? null;
}

// Olio del giorno: grammi totali e ripartizione per pasto (10 g = 1 cucchiaio grande raso)
export type OilSummary = { grams: number; perMeal: { name: string; grams: number }[] };

export function oilSummary(groups: MealGroup[]): OilSummary {
  const perMeal: { name: string; grams: number }[] = [];
  for (const group of groups) {
    let grams = 0;
    for (const item of group.items) {
      const unit = item.quantity_unit.toLowerCase();
      if (!/\bolio\b/i.test(item.food_name) || (unit !== 'g' && unit !== 'ml')) continue;
      const n = Number(item.quantity_numeric);
      if (Number.isFinite(n) && n > 0) grams += n;
    }
    if (grams > 0) perMeal.push({ name: group.name, grams });
  }
  return { grams: perMeal.reduce((sum, m) => sum + m.grams, 0), perMeal };
}
