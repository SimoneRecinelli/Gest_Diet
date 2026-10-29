const intFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 2 });
const spoonFormat = new Intl.NumberFormat('it-IT', { maximumFractionDigits: 1 });

export function formatNumber(n: number): string {
  return intFormat.format(n);
}

// Postgres restituisce i NUMERIC come testo ("80.00"): lo riportiamo a "80"
export function formatQty(value: number | string, unit: string): string {
  const n = Number(value);
  const num = Number.isFinite(n) ? intFormat.format(n) : String(value);
  return `${num} ${unit}`.trim();
}

// Conversione in cucchiai per olio e formaggi grattugiati (10 g = 1 cucchiaio grande raso)
export function spoonsLabel(name: string, value: number | string, unit: string): string | null {
  const u = unit.toLowerCase();
  if (u !== 'g' && u !== 'ml') return null;

  const lower = name.toLowerCase();
  if (!(lower.includes('olio') || lower.includes('parmigiano') || lower.includes('grana'))) return null;

  const n = Number(value);
  if (!Number.isFinite(n) || n <= 0) return null;

  const big = n / 10;
  const small = n / 5;
  const bigLabel = `${spoonFormat.format(big)} ${big === 1 ? 'cucchiaio grande raso' : 'cucchiai grandi rasi'}`;
  const smallLabel = `${spoonFormat.format(small)} ${small === 1 ? 'piccolo' : 'piccoli'}`;
  return `${bigLabel} (o ${smallLabel})`;
}
