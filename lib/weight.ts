import { addDays, daysBetween } from './dates';

export type WeightSettings = {
  start_date: string; // YYYY-MM-DD
  start_kg: number;
  target_kg: number;
  target_date: string; // YYYY-MM-DD
  deficit_kcal: number;
};

export type WeightEntry = { id: number; measured_on: string; kg: number };
export type WeightData = { settings: WeightSettings; entries: WeightEntry[] };
export type Point = { date: string; kg: number };

// Regola comune: circa 7.700 kcal per ogni kg di massa persa
export const KCAL_PER_KG = 7700;
export const MIN_WEEKS = 6;
export const MAX_WEEKS = 78;

// Oltre questa data la proiezione non viene disegnata (evita grafici enormi)
const PROJECTION_CAP_DAYS = 240;

export function weeklyRateFromDeficit(deficitKcal: number): number {
  return (deficitKcal * 7) / KCAL_PER_KG;
}

// Punto di partenza + misure successive, in ordine di data
export function buildPoints(settings: WeightSettings, entries: WeightEntry[]): Point[] {
  const rest = entries
    .filter((e) => e.measured_on > settings.start_date)
    .map((e) => ({ date: e.measured_on, kg: e.kg }))
    .sort((a, b) => a.date.localeCompare(b.date));
  return [{ date: settings.start_date, kg: settings.start_kg }, ...rest];
}

// Peso previsto dalla retta che va dalla partenza all'obiettivo
export function plannedKg(settings: WeightSettings, date: string): number {
  const total = daysBetween(settings.start_date, settings.target_date);
  if (total <= 0) return settings.target_kg;
  const t = Math.min(1, Math.max(0, daysBetween(settings.start_date, date) / total));
  return settings.start_kg + (settings.target_kg - settings.start_kg) * t;
}

// Pendenza (kg al giorno) con i minimi quadrati sulle ultime 6 settimane
export function trendPerDay(points: Point[], windowDays = 42): number | null {
  if (points.length < 2) return null;
  const lastDate = points[points.length - 1].date;
  let sel = points.filter((p) => daysBetween(p.date, lastDate) <= windowDays);
  if (sel.length < 2) sel = points.slice(-2);

  const t0 = sel[0].date;
  const xs = sel.map((p) => daysBetween(t0, p.date));
  const ys = sel.map((p) => p.kg);
  const n = sel.length;
  const mx = xs.reduce((a, b) => a + b, 0) / n;
  const my = ys.reduce((a, b) => a + b, 0) / n;

  let num = 0;
  let den = 0;
  for (let i = 0; i < n; i++) {
    num += (xs[i] - mx) * (ys[i] - my);
    den += (xs[i] - mx) ** 2;
  }
  if (den === 0) return null;
  return num / den;
}

export function projectArrival(
  last: Point,
  slopePerDay: number | null,
  targetKg: number,
): { date: string; days: number } | null {
  if (last.kg <= targetKg) return { date: last.date, days: 0 };
  // Sotto circa 35 g a settimana il ritmo è praticamente fermo
  if (slopePerDay === null || slopePerDay > -0.005) return null;
  const days = Math.ceil((last.kg - targetKg) / -slopePerDay);
  if (days > 1500) return null;
  return { date: addDays(last.date, days), days };
}

export type Pace = { text: string; tone: 'ok' | 'warn' };

// Giudizio indicativo sul ritmo richiesto (kg a settimana)
export function paceLabel(perWeek: number | null): Pace | null {
  if (perWeek === null) return null;
  if (perWeek <= 0) return { text: 'Obiettivo già raggiunto', tone: 'ok' };
  if (perWeek <= 0.5) return { text: 'Ritmo dolce', tone: 'ok' };
  if (perWeek <= 1) return { text: 'Ritmo sostenibile', tone: 'ok' };
  return { text: 'Ritmo molto aggressivo: valuta una data più lontana', tone: 'warn' };
}

export type WeightSummary = {
  points: Point[];
  last: Point;
  previous: Point | null;
  deltaFromStart: number; // negativo = hai perso peso
  deltaFromPrevious: number | null;
  remainingKg: number; // kg ancora da perdere (0 se raggiunto)
  plannedNow: number; // peso previsto dall'obiettivo alla data dell'ultima misura
  aheadKg: number; // positivo = sei più leggero del previsto
  totalWeeks: number;
  totalMonths: number;
  weeksLeft: number | null; // da oggi alla data obiettivo
  requiredPerWeek: number | null; // kg/settimana da perdere da oggi per arrivare in tempo
  planPerWeek: number; // ritmo teorico del deficit del piano
  planArrival: string; // data di arrivo se segui solo il ritmo del piano
  trendPerWeek: number | null; // negativo = stai scendendo
  arrival: { date: string; days: number } | null;
  projectionEnd: Point | null; // estremo della linea di proiezione nel grafico
  measuresInTrend: number;
};

export function summarize(
  settings: WeightSettings,
  entries: WeightEntry[],
  todayKey: string | null,
): WeightSummary {
  const points = buildPoints(settings, entries);
  const last = points[points.length - 1];
  const previous = points.length > 1 ? points[points.length - 2] : null;

  const remainingKg = Math.max(0, last.kg - settings.target_kg);
  const plannedNow = plannedKg(settings, last.date);

  const totalDays = Math.max(0, daysBetween(settings.start_date, settings.target_date));
  const today = todayKey ?? last.date;
  const daysLeft = daysBetween(today, settings.target_date);
  const weeksLeft = daysLeft > 0 ? daysLeft / 7 : null;
  const requiredPerWeek = remainingKg === 0 ? 0 : weeksLeft === null ? null : remainingKg / weeksLeft;

  const planPerWeek = weeklyRateFromDeficit(settings.deficit_kcal);
  const planDays =
    planPerWeek > 0 ? Math.ceil(((settings.start_kg - settings.target_kg) / planPerWeek) * 7) : 0;

  const slope = trendPerDay(points);
  const arrival = projectArrival(last, slope, settings.target_kg);

  let projectionEnd: Point | null = null;
  if (slope !== null && slope < 0 && last.kg > settings.target_kg) {
    const cap = addDays(settings.target_date, PROJECTION_CAP_DAYS);
    if (arrival && daysBetween(arrival.date, cap) >= 0) {
      projectionEnd = { date: arrival.date, kg: settings.target_kg };
    } else {
      projectionEnd = { date: cap, kg: last.kg + slope * daysBetween(last.date, cap) };
    }
  }

  return {
    points,
    last,
    previous,
    deltaFromStart: last.kg - settings.start_kg,
    deltaFromPrevious: previous ? last.kg - previous.kg : null,
    remainingKg,
    plannedNow,
    aheadKg: plannedNow - last.kg,
    totalWeeks: totalDays / 7,
    totalMonths: totalDays / 30.44,
    weeksLeft,
    requiredPerWeek,
    planPerWeek,
    planArrival: addDays(settings.start_date, planDays),
    trendPerWeek: slope === null ? null : slope * 7,
    arrival,
    projectionEnd,
    measuresInTrend: points.length,
  };
}
