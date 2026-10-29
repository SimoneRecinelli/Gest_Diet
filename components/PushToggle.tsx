'use client';

import { useEffect, useState } from 'react';

type State = 'checking' | 'unsupported' | 'install' | 'denied' | 'off' | 'on' | 'busy' | 'error';

function keyToBytes(base64: string): Uint8Array<ArrayBuffer> {
  const padded = base64.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(base64.length / 4) * 4, '=');
  const raw = atob(padded);
  const bytes = new Uint8Array(new ArrayBuffer(raw.length));
  for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
  return bytes;
}

function isIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

export default function PushToggle() {
  const [state, setState] = useState<State>('checking');

  useEffect(() => {
    let cancelled = false;
    const set = (s: State) => {
      if (!cancelled) setState(s);
    };

    if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
      // Su iPhone le notifiche esistono solo con l'app aggiunta alla schermata Home
      Promise.resolve().then(() => set(isIos() ? 'install' : 'unsupported'));
      return () => {
        cancelled = true;
      };
    }

    navigator.serviceWorker
      .register('/sw.js')
      .then(() => navigator.serviceWorker.ready)
      .then((reg) => reg.pushManager.getSubscription())
      .then((sub) => {
        if (sub) set('on');
        else set(Notification.permission === 'denied' ? 'denied' : 'off');
      })
      .catch(() => set('error'));

    return () => {
      cancelled = true;
    };
  }, []);

  async function enable() {
    setState('busy');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off');
        return;
      }
      const res = await fetch('/api/push/key');
      if (!res.ok) throw new Error('chiave');
      const { key } = (await res.json()) as { key: string };
      const reg = await navigator.serviceWorker.register('/sw.js').then(() => navigator.serviceWorker.ready);
      const sub = await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyToBytes(key) });
      const save = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub.toJSON()),
      });
      if (!save.ok) throw new Error('salvataggio');
      setState('on');
    } catch {
      setState('error');
    }
  }

  async function disable() {
    setState('busy');
    try {
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.getSubscription();
      if (sub) {
        await fetch(`/api/push/subscribe?endpoint=${encodeURIComponent(sub.endpoint)}`, { method: 'DELETE' });
        await sub.unsubscribe();
      }
      setState('off');
    } catch {
      setState('error');
    }
  }

  if (state === 'checking' || state === 'unsupported') return null;

  const text: Record<Exclude<State, 'checking' | 'unsupported'>, string> = {
    install:
      'Per ricevere il promemoria sul telefono apri DietOS dall’icona nella schermata Home (Condividi → Aggiungi alla schermata Home).',
    denied: 'Le notifiche sono bloccate: riattivale da Impostazioni → Notifiche → DietOS.',
    off: 'Ricevi una notifica il lunedì mattina se non hai ancora registrato il peso.',
    on: 'Promemoria attivo: ti avviso da lunedì a mercoledì mattina finché manca la pesata.',
    busy: 'Un attimo…',
    error: 'Qualcosa non ha funzionato. Riprova tra poco.',
  };

  return (
    <section className="mx-5 mt-8 rounded-[20px] bg-surface px-[18px] py-4">
      <h2 className="text-lg font-bold">Promemoria della pesata</h2>
      <p className="mt-1 text-[15px] text-muted">{text[state]}</p>
      {(state === 'off' || state === 'error') && (
        <button
          type="button"
          onClick={enable}
          className="mt-3 h-12 w-full rounded-2xl bg-brand text-base font-bold text-white"
        >
          Attiva il promemoria
        </button>
      )}
      {state === 'on' && (
        <button
          type="button"
          onClick={disable}
          className="mt-3 min-h-11 text-[15px] font-semibold text-brand-ink underline"
        >
          Disattiva
        </button>
      )}
    </section>
  );
}
