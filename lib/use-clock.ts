import { useMemo, useSyncExternalStore } from 'react';
import { pad, toKey } from './dates';

export type Clock = { dateKey: string; hour: number } | null;

// Snapshot al minuto, es. "2026-10-29T09:10". Stringa primitiva: React la confronta per valore.
function readClock(): string {
  const d = new Date();
  return `${toKey(d)}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function subscribe(onChange: () => void) {
  const id = setInterval(onChange, 30_000);
  return () => clearInterval(id);
}

/**
 * Data e ora del dispositivo, senza errori di hydration:
 * lato server (e al primo render del client) restituisce null,
 * poi React ri-renderizza con l'orologio vero.
 */
export function useClock(): Clock {
  const raw = useSyncExternalStore(subscribe, readClock, () => '');
  return useMemo(() => {
    if (!raw) return null;
    return {
      dateKey: raw.slice(0, 10),
      hour: Number(raw.slice(11, 13)) + Number(raw.slice(14, 16)) / 60,
    };
  }, [raw]);
}
