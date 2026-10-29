import { useCallback, useSyncExternalStore } from 'react';

const listeners = new Set<() => void>();

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

/**
 * Un valore di testo salvato in localStorage, condiviso tra le schede.
 * Lato server vale sempre '' (nessun errore di hydration).
 */
export function useStoredValue(key: string): [string, (value: string) => void] {
  const getSnapshot = useCallback(() => {
    try {
      return window.localStorage.getItem(key) ?? '';
    } catch {
      return '';
    }
  }, [key]);

  const raw = useSyncExternalStore(subscribe, getSnapshot, () => '');

  const setValue = useCallback(
    (value: string) => {
      try {
        window.localStorage.setItem(key, value);
      } catch {
        // storage non disponibile (es. navigazione privata): si continua senza salvare
      }
      listeners.forEach((l) => l());
    },
    [key],
  );

  return [raw, setValue];
}
