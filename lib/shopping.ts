// Spesa di Simone: cosa serve ogni settimana e quando va ricomprato.
// Il resto (uova, frutta, verdure, carne, pasta...) lo compra la nonna e non va in lista.

export type Staple = {
  id: number;
  name: string;
  // Consumo a settimana, nella stessa unità della confezione
  weeklyNeed: number;
  // Quanto contiene una confezione
  pack: number;
  // Come scrivere la quantità: n = numero di confezioni
  qty: (n: number) => string;
  // Riga di spiegazione sotto il nome
  detail: string;
};

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export const STAPLES: Staple[] = [
  {
    id: 1,
    name: 'Latte Parzialmente Scremato Zymil senza lattosio',
    weeklyNeed: 900, // 150 g × 6 mattine (non il sabato)
    pack: 1000,
    qty: (n) => plural(n, 'litro', 'litri'),
    detail: '150 g ogni mattina, tranne il sabato',
  },
  {
    id: 2,
    name: 'Yogurt alla banana Yomo',
    weeklyNeed: 7, // 1 al giorno
    pack: 2,
    qty: (n) => `${n} ${n === 1 ? 'confezione' : 'confezioni'} da 2`,
    detail: '1 vasetto al giorno, 7 a settimana',
  },
  {
    id: 3,
    name: 'Cereali Coco Pops Risetti (330 g)',
    weeklyNeed: 250, // 50 g × 5 giorni (non martedì e sabato)
    pack: 330,
    qty: (n) => plural(n, 'confezione', 'confezioni'),
    detail: '50 g al giorno, tranne martedì e sabato',
  },
  {
    id: 4,
    name: 'Salsa barbecue Heinz (260 g)',
    weeklyNeed: 90, // 30 g × 3 cene (lunedì, mercoledì, venerdì)
    pack: 260,
    qty: (n) => plural(n, 'bottiglia', 'bottiglie'),
    detail: '30 g a cena il lunedì, mercoledì e venerdì',
  },
  {
    id: 5,
    name: 'Nutella monoporzione 15 g (confezione da 6)',
    weeklyNeed: 3, // 15 g il martedì + 30 g il sabato
    pack: 6,
    qty: (n) => plural(n, 'confezione', 'confezioni'),
    detail: '1 monoporzione il martedì, 2 il sabato',
  },
  {
    id: 6,
    name: 'Mozzarella senza lattosio',
    weeklyNeed: 1, // domenica a pranzo
    pack: 1,
    qty: (n) => plural(n, 'mozzarella', 'mozzarelle'),
    detail: 'Per il pranzo della domenica',
  },
];

// Simula settimana per settimana: si compra quando le scorte non bastano a coprire la settimana
// (con un 5% di tolleranza, così 10 g in meno non fanno comprare una confezione in più).
export function purchasePlan(staple: Staple, weeks: number): number[] {
  const tolerance = staple.weeklyNeed * 0.05;
  const plan: number[] = [];
  let stock = 0;
  for (let w = 0; w < weeks; w += 1) {
    const missing = staple.weeklyNeed - tolerance - stock;
    const buy = Math.max(0, Math.ceil(missing / staple.pack));
    plan.push(buy);
    stock = Math.max(0, stock + buy * staple.pack - staple.weeklyNeed);
  }
  return plan;
}

// Lunedì della prima settimana della lista: tutto si parte da scorte vuote
export const PLAN_START = '2026-10-26';
export const PLAN_WEEKS = 52;
