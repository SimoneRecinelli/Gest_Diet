"use client";

import { useMemo, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import { addDays, daysBetween, formatDayMonth, weekKeys } from '../../lib/dates';
import { haptic } from '../../lib/haptic';
import { PLAN_START, PLAN_WEEKS, STAPLES, purchasePlan } from '../../lib/shopping';
import { useClock } from '../../lib/use-clock';
import { useStoredValue } from '../../lib/use-stored-value';

const STORAGE_KEY = 'dietos-spesa-v2';
const SHOWN_WEEKS = 4;

const PLANS = STAPLES.map((s) => ({ staple: s, plan: purchasePlan(s, PLAN_WEEKS) }));

function parseChecked(raw: string): Set<string> {
  try {
    const data: unknown = JSON.parse(raw);
    if (Array.isArray(data)) return new Set(data.filter((n): n is string => typeof n === 'string'));
  } catch {
    // valore vuoto o rovinato: si riparte da zero
  }
  return new Set();
}

function weekTitle(offset: number): string {
  if (offset === 0) return 'Questa settimana';
  if (offset === 1) return 'Prossima';
  return `Fra ${offset} settimane`;
}

function ItemRow({
  name,
  detail,
  qty,
  checked,
  onToggle,
}: {
  name: string;
  detail: string;
  qty: string;
  checked: boolean;
  onToggle: () => void;
}) {
  return (
    <label className="flex min-h-16 cursor-pointer items-center gap-3.5 border-t border-line py-2.5">
      <input type="checkbox" checked={checked} onChange={onToggle} className="size-6 shrink-0 accent-brand" />
      <span className="min-w-0 flex-1">
        <span className={`block text-base font-medium ${checked ? 'text-muted line-through' : ''}`}>{name}</span>
        <span className="block text-sm text-muted">{detail}</span>
      </span>
      <span className={`text-right text-sm whitespace-nowrap ${checked ? 'font-semibold text-muted' : 'font-bold'}`}>
        {qty}
      </span>
    </label>
  );
}

export default function ListaSpesa() {
  const clock = useClock();
  const [raw, setRaw] = useStoredValue(STORAGE_KEY);
  const [picked, setPicked] = useState(0);
  const checked = useMemo(() => parseChecked(raw), [raw]);

  const todayKey = clock?.dateKey ?? null;
  // Indice della settimana corrente nel piano (0 = settimana del 26 ottobre 2026)
  const currentIndex = todayKey
    ? Math.min(PLAN_WEEKS - SHOWN_WEEKS, Math.max(0, Math.floor(daysBetween(PLAN_START, weekKeys(todayKey)[0]) / 7)))
    : 0;
  const weekIndex = currentIndex + picked;
  const weekStart = addDays(PLAN_START, weekIndex * 7);
  const weekEnd = addDays(weekStart, 6);

  const due = PLANS.map(({ staple, plan }) => ({ staple, buy: plan[weekIndex] })).filter((r) => r.buy > 0);
  const notDue = PLANS.filter(({ plan }) => plan[weekIndex] === 0).map(({ staple, plan }) => {
    const next = plan.findIndex((n, i) => i > weekIndex && n > 0);
    return { staple, inWeeks: next === -1 ? null : next - weekIndex };
  });

  const keyOf = (id: number) => `${weekStart}:${id}`;
  const todo = due.filter((r) => !checked.has(keyOf(r.staple.id)));
  const done = due.filter((r) => checked.has(keyOf(r.staple.id)));
  const progress = due.length > 0 ? Math.round((done.length / due.length) * 100) : 0;

  function toggle(id: number) {
    haptic();
    const next = new Set(checked);
    const key = keyOf(id);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    setRaw(JSON.stringify([...next]));
  }

  function resetWeek() {
    const next = new Set(checked);
    for (const r of due) next.delete(keyOf(r.staple.id));
    setRaw(JSON.stringify([...next]));
  }

  return (
    <div className="min-h-dvh bg-page pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-xl">
        <header className="sticky top-0 z-10 border-b border-line bg-page px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-4">
          <div className="flex items-baseline justify-between">
            <h1 className="text-[32px] leading-tight font-extrabold tracking-tight">Spesa</h1>
            <p className="text-[15px] font-semibold text-brand-ink">
              {done.length} di {due.length} presi
            </p>
          </div>
          <div
            role="progressbar"
            aria-label="Articoli presi"
            aria-valuemin={0}
            aria-valuemax={due.length}
            aria-valuenow={done.length}
            className="mt-3 h-2 overflow-hidden rounded-full bg-line"
          >
            <div
              className="h-full rounded-full bg-brand transition-[width] duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
          <div className="mt-4 flex gap-1 rounded-2xl bg-surface p-1" role="group" aria-label="Settimana">
            {Array.from({ length: SHOWN_WEEKS }).map((_, i) => (
              <button
                key={i}
                type="button"
                aria-pressed={i === picked}
                onClick={() => setPicked(i)}
                className={`min-h-11 flex-1 rounded-xl text-[15px] ${
                  i === picked ? 'bg-brand font-bold text-white' : 'font-semibold text-muted'
                }`}
              >
                {i === 0 ? 'Questa' : i === 1 ? 'Prossima' : `+${i}`}
              </button>
            ))}
          </div>
        </header>

        <main className="px-5">
          <p className="pt-5 text-[15px] font-medium text-muted">
            {weekTitle(picked)}
            {todayKey && ` · ${formatDayMonth(weekStart)} – ${formatDayMonth(weekEnd)}`}
          </p>

          {todo.length > 0 && (
            <section aria-label="Da comprare" className="pt-2">
              <h2 className="pb-1 text-lg font-bold">Da comprare</h2>
              {todo.map(({ staple, buy }) => (
                <ItemRow
                  key={staple.id}
                  name={staple.name}
                  detail={staple.detail}
                  qty={staple.qty(buy)}
                  checked={false}
                  onToggle={() => toggle(staple.id)}
                />
              ))}
            </section>
          )}

          {due.length === 0 && (
            <p className="pt-6 text-base text-muted">Questa settimana non c’è niente da comprare.</p>
          )}

          {done.length > 0 && (
            <section aria-label="Articoli presi" className="pt-6">
              <h2 className="pb-1 text-lg font-bold text-muted">Presi ({done.length})</h2>
              {done.map(({ staple, buy }) => (
                <ItemRow
                  key={staple.id}
                  name={staple.name}
                  detail={staple.detail}
                  qty={staple.qty(buy)}
                  checked
                  onToggle={() => toggle(staple.id)}
                />
              ))}
              <button
                type="button"
                onClick={resetWeek}
                className="mt-2 min-h-12 w-full border-t border-line text-[15px] font-semibold text-brand"
              >
                Azzera la lista della settimana
              </button>
            </section>
          )}

          {due.length > 0 && todo.length === 0 && (
            <p className="pt-6 text-center text-base font-medium text-brand-ink">Hai preso tutto.</p>
          )}

          {notDue.length > 0 && (
            <section aria-label="Non serve questa settimana" className="pt-8">
              <h2 className="pb-1 text-lg font-bold text-muted">Non serve questa settimana</h2>
              {notDue.map(({ staple, inWeeks }) => (
                <div key={staple.id} className="flex min-h-12 items-center justify-between gap-3 border-t border-line py-2">
                  <span className="text-[15px] text-muted">{staple.name}</span>
                  <span className="text-sm whitespace-nowrap text-muted">
                    {inWeeks === null ? '' : inWeeks === 1 ? 'dalla prossima' : `fra ${inWeeks} sett.`}
                  </span>
                </div>
              ))}
            </section>
          )}
        </main>
      </div>

      <BottomNav active="spesa" />
    </div>
  );
}
