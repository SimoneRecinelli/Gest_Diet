"use client";

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import BottomNav from '../components/BottomNav';
import { DAYS, dayIdOf, dayOfMonth, formatLong, weekKeys } from '../lib/dates';
import { formatNumber, formatQty, spoonsLabel } from '../lib/format';
import { getFoodIcon } from '../lib/food-icons';
import {
  groupByMeal,
  isFreeMealChooser,
  mealKcal,
  nextMealName,
  type DietItem,
} from '../lib/meals';
import { useClock } from '../lib/use-clock';
import type { WeightData } from '../lib/weight';

function Chevron({ open }: { open: boolean }) {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={`transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function FoodIcon({ name, tinted, small }: { name: string; tinted?: boolean; small?: boolean }) {
  return (
    <span
      aria-hidden="true"
      className={`flex shrink-0 items-center justify-center ${
        small ? 'size-8 rounded-lg text-lg' : 'size-10 rounded-xl text-[22px]'
      } ${tinted ? 'bg-white' : 'bg-surface'}`}
    >
      {getFoodIcon(name)}
    </span>
  );
}

function Chip({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full bg-brand px-2.5 py-1 text-[13px] font-semibold text-white">
      {children}
    </span>
  );
}

function ItemRow({ item, tinted }: { item: DietItem; tinted: boolean }) {
  const spoons = spoonsLabel(item.food_name, item.quantity_numeric, item.quantity_unit);
  return (
    <div
      className={`flex min-h-14 items-center justify-between gap-3 border-t ${
        tinted ? 'border-brand/20' : 'border-line'
      }`}
    >
      <div className="flex min-w-0 items-center gap-3 py-2">
        <FoodIcon name={item.food_name} tinted={tinted} />
        <div className="flex flex-col gap-0.5">
          <span className="text-base font-medium">{item.food_name}</span>
          {spoons && <span className="text-sm text-muted">{spoons}</span>}
        </div>
      </div>
      <span className="whitespace-nowrap text-base font-bold">
        {formatQty(item.quantity_numeric, item.quantity_unit)}
      </span>
    </div>
  );
}

function AlternativesList({ item, tinted }: { item: DietItem; tinted: boolean }) {
  const [open, setOpen] = useState(false);
  const count = item.alternatives.length;
  if (count === 0) return null;

  return (
    <div className={`border-t ${tinted ? 'border-brand/20' : 'border-line'}`}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className={`flex min-h-12 w-full items-center gap-1.5 text-[15px] font-semibold ${
          tinted ? 'text-brand-ink' : 'text-brand'
        }`}
      >
        Alternative ({count})
        <Chevron open={open} />
      </button>
      {open && (
        <ul className={`mb-3 rounded-2xl px-3.5 ${tinted ? 'bg-white' : 'bg-surface'}`}>
          {item.alternatives.map((alt, i) => {
            const spoons = spoonsLabel(alt.name, alt.qty, alt.unit);
            return (
              <li
                key={i}
                className={`flex min-h-12 items-center justify-between gap-3 py-2 ${
                  i > 0 ? 'border-t border-line' : ''
                }`}
              >
                <div className="flex min-w-0 items-center gap-2.5">
                  <FoodIcon name={alt.name} small />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-[15px] font-medium">{alt.name}</span>
                    {spoons && <span className="text-sm text-muted">{spoons}</span>}
                  </div>
                </div>
                <span className="whitespace-nowrap text-[15px] font-bold">
                  {formatQty(alt.qty, alt.unit)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

// "Menu Pizzeria: 1 pizza + ..." → titolo e descrizione
function splitOption(name: string): { title: string; description: string } {
  const i = name.indexOf(':');
  if (i === -1) return { title: name, description: '' };
  return { title: name.slice(0, i).trim(), description: name.slice(i + 1).trim() };
}

function FreeMealChooser({ item, tinted }: { item: DietItem; tinted: boolean }) {
  const [chosen, setChosen] = useState<number | null>(null);
  return (
    <fieldset className={`border-t pt-3 pb-3 ${tinted ? 'border-brand/20' : 'border-line'}`}>
      <legend className="sr-only">{item.food_name}</legend>
      <p className="pb-3 text-[15px] leading-snug text-muted">{item.food_name}: scegli un menu</p>
      <div className="flex flex-col gap-2">
        {item.alternatives.map((alt, i) => {
          const { title, description } = splitOption(alt.name);
          const selected = chosen === i;
          return (
            <label
              key={i}
              className={`flex min-h-19 cursor-pointer items-start gap-3.5 rounded-[18px] border-2 bg-white px-4 py-3.5 ${
                selected ? 'border-brand' : 'border-line'
              }`}
            >
              <input
                type="radio"
                name={`free-meal-${item.item_id}`}
                checked={selected}
                onChange={() => setChosen(i)}
                className="mt-0.5 size-[22px] shrink-0 accent-brand"
              />
              <FoodIcon name={alt.name} />
              <span className="flex flex-col gap-0.5">
                <span className="text-base font-bold">{title}</span>
                {description && (
                  <span className="text-sm leading-snug text-muted">{description}</span>
                )}
              </span>
            </label>
          );
        })}
      </div>
    </fieldset>
  );
}

function CheatBanner({ item }: { item: DietItem }) {
  return (
    <div className="mt-1 rounded-2xl bg-brand-soft px-4 py-5 text-center">
      <span aria-hidden="true" className="mb-1 block text-3xl">
        🍕
      </span>
      <p className="text-lg font-bold text-brand-ink">{item.food_name}</p>
      <p className="mt-1 text-sm font-medium text-brand-ink">Goditi il pasto libero!</p>
    </div>
  );
}

function MealSection({
  name,
  items,
  highlighted,
}: {
  name: string;
  items: DietItem[];
  highlighted: boolean;
}) {
  const kcal = mealKcal(items);
  const hasFreeMeal = items.some((i) => i.is_cheat_meal || isFreeMealChooser(i));

  return (
    <section
      aria-label={name}
      className={
        highlighted ? 'mx-3 mt-5 rounded-3xl bg-tint px-5 pt-4 pb-1' : 'px-5 pt-6'
      }
    >
      <div className="flex items-center justify-between gap-3 pb-2">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="text-xl font-bold">{name}</h2>
          {highlighted && <Chip>Prossimo</Chip>}
          {hasFreeMeal && <Chip>Pasto libero</Chip>}
        </div>
        {kcal > 0 && (
          <span
            className={`whitespace-nowrap text-sm font-semibold ${
              highlighted ? 'text-brand-ink' : 'text-muted'
            }`}
          >
            ~{formatNumber(kcal)} kcal
          </span>
        )}
      </div>

      {items.map((item) => {
        if (item.is_cheat_meal) return <CheatBanner key={item.item_id} item={item} />;
        if (isFreeMealChooser(item)) {
          return <FreeMealChooser key={item.item_id} item={item} tinted={highlighted} />;
        }
        return (
          <div key={item.item_id}>
            <ItemRow item={item} tinted={highlighted} />
            <AlternativesList item={item} tinted={highlighted} />
          </div>
        );
      })}
    </section>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-8 px-5 pt-8" aria-hidden="true">
      {[3, 2, 3].map((rows, i) => (
        <div key={i} className="space-y-3">
          <div className="h-6 w-32 rounded-lg bg-surface" />
          {Array.from({ length: rows }).map((_, r) => (
            <div key={r} className="h-12 rounded-xl bg-surface" />
          ))}
        </div>
      ))}
    </div>
  );
}

type Result = { day: number; attempt: number; items: DietItem[] | null };

export default function Dashboard() {
  const clock = useClock();
  const [picked, setPicked] = useState<number | null>(null);
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState<Result>({ day: 0, attempt: 0, items: null });

  const ready = clock !== null;
  const todayKey = clock?.dateKey ?? null;
  const todayId = todayKey ? dayIdOf(todayKey) : 1;
  const selectedDay = picked ?? todayId;
  const keys = useMemo(() => (todayKey ? weekKeys(todayKey) : null), [todayKey]);

  useEffect(() => {
    // Aspetta l'orologio del dispositivo, così non scarica il giorno sbagliato
    if (!ready) return;
    let cancelled = false;
    fetch(`/api/diet?day=${selectedDay}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled) return;
        setResult({
          day: selectedDay,
          attempt,
          items: Array.isArray(data)
            ? (data as DietItem[]).map((i) => ({ ...i, alternatives: i.alternatives ?? [] }))
            : null,
        });
      })
      .catch(() => {
        if (!cancelled) setResult({ day: selectedDay, attempt, items: null });
      });
    return () => {
      cancelled = true;
    };
  }, [ready, selectedDay, attempt]);

  // Date delle pesate registrate, per il promemoria del lunedì (se la richiesta fallisce, niente promemoria)
  const [weighIns, setWeighIns] = useState<string[] | null>(null);
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    fetch('/api/weight')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WeightData | null) => {
        if (!cancelled && data && Array.isArray(data.entries)) {
          setWeighIns(data.entries.map((e) => e.measured_on));
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [ready]);

  // Promemoria da lunedì a mercoledì finché la pesata della settimana manca
  const weighedThisWeek = weighIns !== null && keys !== null && weighIns.some((d) => keys.includes(d));
  const showWeighReminder = weighIns !== null && keys !== null && !weighedThisWeek && todayId <= 3;

  const loading = !ready || result.day !== selectedDay || result.attempt !== attempt;
  const failed = !loading && result.items === null;
  const groups = useMemo(() => (result.items ? groupByMeal(result.items) : []), [result.items]);

  const isToday = selectedDay === todayId;
  const nextName =
    clock && isToday && !loading
      ? nextMealName(
          groups.map((g) => g.name),
          clock.hour,
        )
      : null;

  const totalKcal = groups.reduce((sum, g) => sum + mealKcal(g.items), 0);
  const dayName = DAYS.find((d) => d.id === selectedDay)?.name ?? '';
  const selectedKey = keys ? keys[selectedDay - 1] : null;

  return (
    <div className="min-h-dvh bg-white pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-xl">
        <header className="flex items-center justify-between px-5 pt-[max(1rem,env(safe-area-inset-top))] pb-1">
          <div>
            <p className="min-h-5 text-sm font-medium text-muted">
              {selectedKey ? formatLong(selectedKey) : ''}
            </p>
            <h1 className="mt-0.5 text-[32px] leading-tight font-extrabold tracking-tight">
              {isToday && ready ? 'Oggi' : dayName}
            </h1>
          </div>
          <div
            aria-hidden="true"
            className="flex size-11 items-center justify-center rounded-full bg-brand-soft text-[15px] font-bold text-brand-ink"
          >
            SR
          </div>
        </header>

        <nav aria-label="Giorni della settimana" className="flex gap-1 px-4 pt-3.5 pb-1">
          {DAYS.map((d, i) => {
            const key = keys?.[i];
            const selected = d.id === selectedDay;
            const today = ready && d.id === todayId;
            return (
              <button
                key={d.id}
                type="button"
                aria-pressed={selected}
                aria-label={`${d.name}${key ? ` ${dayOfMonth(key)}` : ''}${today ? ', oggi' : ''}`}
                onClick={() => setPicked(d.id)}
                className={`flex h-[68px] flex-1 flex-col items-center justify-center gap-1 rounded-[18px] ${
                  selected ? 'bg-brand text-white' : 'text-muted'
                }`}
              >
                <span className="text-[13px] font-medium">{d.short}</span>
                <span
                  className={`min-h-6 text-lg font-bold ${selected ? 'text-white' : 'text-ink'}`}
                >
                  {key ? dayOfMonth(key) : ''}
                </span>
                <span
                  className={`-mt-2 size-[5px] rounded-full ${
                    today ? (selected ? 'bg-white' : 'bg-brand') : 'bg-transparent'
                  }`}
                />
              </button>
            );
          })}
        </nav>

        {showWeighReminder && (
          <Link
            href="/peso"
            className="mx-5 mt-3 flex min-h-14 items-center justify-between gap-3 rounded-[20px] bg-tint px-[18px] py-3 text-brand-ink"
          >
            <span className="text-[15px] font-semibold">
              {todayId === 1
                ? 'È lunedì: registra il peso'
                : 'Questa settimana non hai ancora registrato il peso'}
            </span>
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
              className="shrink-0"
            >
              <path d="m9 6 6 6-6 6" />
            </svg>
          </Link>
        )}

        {!loading && groups.length > 0 && (
          <div className="mx-5 mt-3 flex items-center justify-between rounded-[20px] bg-surface px-[18px] py-4">
            <div>
              <p className="text-sm font-medium text-muted">
                {totalKcal > 0 ? 'Totale del giorno' : 'Giornata'}
              </p>
              <p className="mt-0.5 text-[26px] font-extrabold tracking-tight">
                {totalKcal > 0
                  ? `${formatNumber(totalKcal)} kcal`
                  : `${groups.length} ${groups.length === 1 ? 'pasto' : 'pasti'}`}
              </p>
            </div>
            {totalKcal > 0 && (
              <span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-ink">
                {groups.length} {groups.length === 1 ? 'pasto' : 'pasti'}
              </span>
            )}
          </div>
        )}

        {loading && <Skeleton />}

        {failed && (
          <div
            role="alert"
            className="mx-5 mt-6 rounded-2xl bg-red-50 px-4 py-4 text-[15px] text-red-900"
          >
            <p>Non riesco a caricare il piano di {dayName.toLowerCase()}.</p>
            <button
              type="button"
              onClick={() => setAttempt((a) => a + 1)}
              className="mt-2 min-h-11 font-semibold underline"
            >
              Riprova
            </button>
          </div>
        )}

        {!loading && !failed && groups.length === 0 && (
          <p className="px-5 pt-8 text-base text-muted">Nessun pasto previsto per questo giorno.</p>
        )}

        {!loading &&
          groups.map((group) => (
            <MealSection
              key={group.name}
              name={group.name}
              items={group.items}
              highlighted={group.name === nextName}
            />
          ))}
      </div>

      <BottomNav active="oggi" />
    </div>
  );
}
