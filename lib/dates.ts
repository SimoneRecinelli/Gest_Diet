// Giorni della settimana come nel database: 1 = Lunedì ... 7 = Domenica
export const DAYS = [
  { id: 1, name: 'Lunedì', short: 'Lun' },
  { id: 2, name: 'Martedì', short: 'Mar' },
  { id: 3, name: 'Mercoledì', short: 'Mer' },
  { id: 4, name: 'Giovedì', short: 'Gio' },
  { id: 5, name: 'Venerdì', short: 'Ven' },
  { id: 6, name: 'Sabato', short: 'Sab' },
  { id: 7, name: 'Domenica', short: 'Dom' },
] as const;

export function pad(n: number): string {
  return String(n).padStart(2, '0');
}

// Data locale nel formato YYYY-MM-DD
export function toKey(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Mezzogiorno evita problemi di cambio ora legale
function fromKey(key: string): Date {
  return new Date(`${key}T12:00:00`);
}

export function dayIdOf(key: string): number {
  const g = fromKey(key).getDay(); // 0 = Domenica
  return g === 0 ? 7 : g;
}

export function addDays(key: string, n: number): string {
  const d = fromKey(key);
  d.setDate(d.getDate() + n);
  return toKey(d);
}

// Le 7 date (lunedì → domenica) della settimana che contiene `key`
export function weekKeys(key: string): string[] {
  const monday = addDays(key, -(dayIdOf(key) - 1));
  return DAYS.map((_, i) => addDays(monday, i));
}

export function dayOfMonth(key: string): number {
  return fromKey(key).getDate();
}

export function formatLong(key: string): string {
  const text = fromKey(key).toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
  return text.charAt(0).toUpperCase() + text.slice(1);
}
