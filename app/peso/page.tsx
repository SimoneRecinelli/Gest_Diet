"use client";

import { useEffect, useMemo, useState } from 'react';
import BottomNav from '../../components/BottomNav';
import PushToggle from '../../components/PushToggle';
import WeightChart from '../../components/WeightChart';
import {
  addDays,
  dayIdOf,
  daysBetween,
  formatDayMonth,
  formatShortDate,
  formatWeekdayDate,
  weekKeys,
} from '../../lib/dates';
import { formatKg, formatKgSigned } from '../../lib/format';
import {
  MAX_WEEKS,
  MIN_WEEKS,
  paceLabel,
  summarize,
  type WeightData,
  type WeightSettings,
} from '../../lib/weight';
import { haptic } from '../../lib/haptic';
import { useClock } from '../../lib/use-clock';

function parseKg(text: string): number | null {
  const n = Number(text.trim().replace(',', '.'));
  return Number.isFinite(n) && n > 30 && n < 300 ? n : null;
}

// Restituisce null se è andato tutto bene, altrimenti il messaggio d'errore
async function callApi(
  method: 'POST' | 'DELETE' | 'PATCH',
  url: string,
  body?: unknown,
): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
    });
    if (res.ok) return null;
    const data: unknown = await res.json().catch(() => null);
    const message = (data as { error?: string } | null)?.error;
    return message ?? 'Qualcosa è andato storto, riprova';
  } catch {
    return 'Connessione assente, riprova';
  }
}

function Tile({
  label,
  value,
  note,
  tone,
}: {
  label: string;
  value: string;
  note?: string;
  tone?: 'good' | 'warn';
}) {
  return (
    <div className="rounded-[20px] bg-surface px-4 py-3.5">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p
        className={`mt-1 text-xl leading-tight font-extrabold tracking-tight ${
          tone === 'good' ? 'text-brand-ink' : tone === 'warn' ? 'text-amber-800 dark:text-amber-300' : ''
        }`}
      >
        {value}
      </p>
      {note && <p className="mt-1 text-sm leading-snug text-muted">{note}</p>}
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-4 px-5 pt-6" aria-hidden="true">
      <div className="h-32 rounded-[20px] bg-surface" />
      <div className="h-48 rounded-[20px] bg-surface" />
      <div className="h-56 rounded-[20px] bg-surface" />
    </div>
  );
}

type Loaded = { key: number; value: WeightData | null };

export default function Peso() {
  const clock = useClock();
  const todayKey = clock?.dateKey ?? null;

  const [reloadKey, setReloadKey] = useState(0);
  const [loaded, setLoaded] = useState<Loaded>({ key: -1, value: null });

  const [formDate, setFormDate] = useState<string | null>(null);
  const [formKg, setFormKg] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Simulazione: null = valore salvato
  const [simWeeks, setSimWeeks] = useState<number | null>(null);
  const [simTarget, setSimTarget] = useState<string | null>(null);
  const [savingGoal, setSavingGoal] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/weight')
      .then((res) => (res.ok ? res.json() : null))
      .then((data: WeightData | null) => {
        if (cancelled) return;
        setLoaded({ key: reloadKey, value: data && data.settings ? data : null });
      })
      .catch(() => {
        if (!cancelled) setLoaded({ key: reloadKey, value: null });
      });
    return () => {
      cancelled = true;
    };
  }, [reloadKey]);

  const loading = loaded.key !== reloadKey;
  const data = loaded.value;
  const settings = data?.settings ?? null;
  const entries = useMemo(() => data?.entries ?? [], [data]);

  // Obiettivo simulato (non salvato finché non lo confermi)
  const savedWeeks = settings
    ? Math.min(MAX_WEEKS, Math.max(MIN_WEEKS, Math.round(daysBetween(settings.start_date, settings.target_date) / 7)))
    : MIN_WEEKS;
  const sliderWeeks = simWeeks ?? savedWeeks;
  const simTargetKg = simTarget === null ? null : parseKg(simTarget);

  const simSettings: WeightSettings | null = useMemo(() => {
    if (!settings) return null;
    return {
      ...settings,
      target_kg: simTargetKg ?? settings.target_kg,
      target_date: simWeeks === null ? settings.target_date : addDays(settings.start_date, simWeeks * 7),
    };
  }, [settings, simWeeks, simTargetKg]);

  const summary = useMemo(
    () => (simSettings ? summarize(simSettings, entries, todayKey) : null),
    [simSettings, entries, todayKey],
  );

  const dirty =
    !!settings &&
    !!simSettings &&
    (simSettings.target_date !== settings.target_date || simSettings.target_kg !== settings.target_kg);

  const weekDates = todayKey ? weekKeys(todayKey) : [];
  const thisWeekEntry = entries.find((e) => weekDates.includes(e.measured_on)) ?? null;
  const isMonday = todayKey ? dayIdOf(todayKey) === 1 : false;

  const effectiveDate = formDate ?? todayKey ?? '';
  const existingForDate = entries.find((e) => e.measured_on === effectiveDate) ?? null;

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    const kg = parseKg(formKg);
    if (kg === null) {
      setMessage({ ok: false, text: 'Inserisci un peso valido, ad esempio 88,4' });
      return;
    }
    haptic();
    setSaving(true);
    setMessage(null);
    const error = await callApi('POST', '/api/weight', { measured_on: effectiveDate, kg });
    setSaving(false);
    if (error) {
      setMessage({ ok: false, text: error });
      return;
    }
    setFormKg('');
    setFormDate(null);
    setMessage({ ok: true, text: `Registrato: ${formatKg(Math.round(kg * 10) / 10)} kg` });
    setReloadKey((k) => k + 1);
  }

  async function handleDelete(id: number, date: string) {
    if (!window.confirm(`Eliminare la misura del ${formatShortDate(date)}?`)) return;
    const error = await callApi('DELETE', `/api/weight?id=${id}`);
    setMessage(error ? { ok: false, text: error } : { ok: true, text: 'Misura eliminata' });
    if (!error) setReloadKey((k) => k + 1);
  }

  async function handleSaveGoal() {
    if (!simSettings) return;
    setSavingGoal(true);
    const error = await callApi('PATCH', '/api/weight', {
      target_kg: simSettings.target_kg,
      target_date: simSettings.target_date,
    });
    setSavingGoal(false);
    if (error) {
      setMessage({ ok: false, text: error });
      return;
    }
    setSimWeeks(null);
    setSimTarget(null);
    setMessage({ ok: true, text: 'Obiettivo aggiornato' });
    setReloadKey((k) => k + 1);
  }

  function resetSimulation() {
    setSimWeeks(null);
    setSimTarget(null);
  }

  const pace = summary ? paceLabel(summary.requiredPerWeek) : null;

  return (
    <div className="min-h-dvh bg-page pb-[calc(6rem+env(safe-area-inset-bottom))]">
      <div className="mx-auto w-full max-w-xl">
        <header className="px-5 pt-[calc(env(safe-area-inset-top)+2rem)] pb-1">
          <p className="min-h-6 text-base font-semibold text-ink/75">
            {summary ? `Partenza ${formatKg(summary.points[0].kg)} kg · ${formatShortDate(summary.points[0].date)}` : ''}
          </p>
          <h1 className="mt-0.5 text-[32px] leading-tight font-extrabold tracking-tight">Peso</h1>
        </header>

        {(loading || !todayKey) && <Skeleton />}

        {!loading && todayKey && !data && (
          <div role="alert" className="mx-5 mt-6 rounded-2xl bg-red-50 px-4 py-4 text-[15px] text-red-900 dark:bg-red-950 dark:text-red-100">
            <p>Non riesco a caricare i dati del peso.</p>
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="mt-2 min-h-11 font-semibold underline"
            >
              Riprova
            </button>
          </div>
        )}

        {!loading && todayKey && settings && simSettings && summary && (
          <>
            {/* Peso attuale */}
            <section aria-label="Peso attuale" className="mx-5 mt-3 rounded-[20px] bg-surface px-[18px] py-4">
              <p className="text-sm font-medium text-muted">
                {entries.length > 0 ? `Ultima misura · ${formatDayMonth(summary.last.date)}` : 'Peso di partenza'}
              </p>
              <p className="mt-0.5 text-[40px] leading-none font-extrabold tracking-tight">
                {formatKg(summary.last.kg)} <span className="text-xl font-bold text-muted">kg</span>
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {entries.length > 0 && (
                  <span className="rounded-full bg-brand-soft px-3 py-1.5 text-sm font-semibold text-brand-ink">
                    {formatKgSigned(summary.deltaFromStart)} kg dall’inizio
                  </span>
                )}
                {summary.deltaFromPrevious !== null && summary.points.length > 2 && (
                  <span className="rounded-full bg-page px-3 py-1.5 text-sm font-semibold text-muted">
                    {formatKgSigned(summary.deltaFromPrevious)} kg sull’ultima
                  </span>
                )}
              </div>
              <p className="mt-3 text-[15px] text-muted">
                {summary.remainingKg > 0
                  ? `Mancano ${formatKg(summary.remainingKg)} kg al peso forma di ${formatKg(settings.target_kg)} kg.`
                  : `Hai raggiunto il peso forma di ${formatKg(settings.target_kg)} kg.`}
              </p>
            </section>

            {/* Registra */}
            <section aria-label="Registra il peso" className="mx-5 mt-4">
              <h2 className="text-xl font-bold">Registra il peso</h2>
              <p
                className={`mt-1 text-[15px] ${
                  !thisWeekEntry && isMonday ? 'font-semibold text-brand-ink' : 'text-muted'
                }`}
              >
                {thisWeekEntry
                  ? `Questa settimana hai già registrato: ${formatKg(thisWeekEntry.kg)} kg (${formatWeekdayDate(thisWeekEntry.measured_on)}).`
                  : isMonday
                    ? 'Oggi è lunedì: è il giorno della pesata.'
                    : 'Questa settimana non hai ancora registrato il peso.'}
              </p>

              <form onSubmit={handleSave} className="mt-3 space-y-3">
                <div className="flex gap-3">
                  <div className="flex-1">
                    <label htmlFor="w-date" className="mb-1 block text-sm font-medium text-muted">
                      Data
                    </label>
                    <input
                      id="w-date"
                      type="date"
                      value={effectiveDate}
                      min={settings.start_date}
                      max={todayKey}
                      onChange={(e) => setFormDate(e.target.value || null)}
                      className="h-14 w-full rounded-2xl border-2 border-line bg-surface px-3 text-base font-semibold focus:border-brand focus:outline-none"
                    />
                  </div>
                  <div className="w-32">
                    <label htmlFor="w-kg" className="mb-1 block text-sm font-medium text-muted">
                      Peso (kg)
                    </label>
                    <input
                      id="w-kg"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      placeholder="88,4"
                      value={formKg}
                      onChange={(e) => setFormKg(e.target.value)}
                      className="h-14 w-full rounded-2xl border-2 border-line bg-surface px-3 text-center text-lg font-bold focus:border-brand focus:outline-none"
                    />
                  </div>
                </div>

                {existingForDate && (
                  <p className="text-sm text-muted">
                    Per questa data c’è già {formatKg(existingForDate.kg)} kg: verrà aggiornato.
                  </p>
                )}

                <button
                  type="submit"
                  disabled={saving || !effectiveDate}
                  className="h-14 w-full rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
                >
                  {saving ? 'Salvataggio…' : existingForDate ? 'Aggiorna' : 'Salva'}
                </button>

                {message && (
                  <p
                    role={message.ok ? 'status' : 'alert'}
                    className={`text-[15px] font-medium ${message.ok ? 'text-brand-ink' : 'text-red-700 dark:text-red-400'}`}
                  >
                    {message.text}
                  </p>
                )}
              </form>
            </section>

            {/* Grafico */}
            <section aria-label="Andamento" className="mx-5 mt-8">
              <h2 className="text-xl font-bold">Andamento</h2>
              <div className="mt-2 rounded-[20px] border border-line p-2">
                <WeightChart
                  settings={simSettings}
                  points={summary.points}
                  projectionEnd={summary.projectionEnd}
                  todayKey={todayKey}
                />
              </div>
              <ul className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
                <li className="flex items-center gap-2">
                  <span className="h-0.5 w-5 bg-ink" aria-hidden="true" /> Reale
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 border-t-2 border-dashed border-brand" aria-hidden="true" /> Obiettivo
                </li>
                <li className="flex items-center gap-2">
                  <span className="w-5 border-t-2 border-dotted border-muted" aria-hidden="true" /> Al ritmo attuale
                </li>
              </ul>
            </section>

            {/* Numeri chiave */}
            <section aria-label="Numeri chiave" className="mx-5 mt-6 grid grid-cols-2 gap-3">
              <Tile
                label="Rispetto all’obiettivo"
                value={
                  entries.length === 0
                    ? '—'
                    : Math.abs(summary.aheadKg) < 0.05
                      ? 'In linea'
                      : summary.aheadKg > 0
                        ? `In anticipo di ${formatKg(summary.aheadKg)} kg`
                        : `In ritardo di ${formatKg(-summary.aheadKg)} kg`
                }
                note={entries.length === 0 ? 'Dopo la prima misura' : undefined}
                tone={entries.length === 0 ? undefined : summary.aheadKg >= -0.05 ? 'good' : 'warn'}
              />
              <Tile
                label="Ritmo attuale"
                value={summary.trendPerWeek === null ? '—' : `${formatKgSigned(summary.trendPerWeek)} kg/sett.`}
                note={
                  summary.trendPerWeek === null
                    ? 'Servono almeno 2 misure'
                    : `Su ${summary.measuresInTrend} misure`
                }
              />
              <Tile
                label="Arrivo previsto"
                value={summary.arrival ? formatShortDate(summary.arrival.date) : '—'}
                note={summary.arrival ? 'Se mantieni il ritmo attuale' : 'Non ancora stimabile'}
              />
              <Tile
                label="Da perdere"
                value={`${formatKg(summary.remainingKg)} kg`}
                note={`Obiettivo ${formatShortDate(simSettings.target_date)}`}
              />
            </section>

            {/* Simulazione */}
            <section aria-label="Simulazione dell’obiettivo" className="mx-5 mt-8">
              <h2 className="text-xl font-bold">Simulazione</h2>
              <p className="mt-1 text-[15px] leading-snug text-muted">
                Sposta la data per vedere che ritmo serve per arrivare al peso forma.
              </p>

              <div className="mt-4 rounded-[20px] bg-surface p-4">
                <div className="flex items-center justify-between gap-4">
                  <label htmlFor="sim-kg" className="text-[15px] font-semibold">
                    Peso forma
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      id="sim-kg"
                      type="text"
                      inputMode="decimal"
                      autoComplete="off"
                      value={simTarget ?? formatKg(settings.target_kg)}
                      onChange={(e) => setSimTarget(e.target.value)}
                      aria-invalid={simTarget !== null && simTargetKg === null ? true : undefined}
                      className={`h-12 w-24 rounded-xl border-2 bg-page px-3 text-center text-lg font-bold focus:outline-none ${
                        simTarget !== null && simTargetKg === null
                          ? 'border-red-600'
                          : 'border-line focus:border-brand'
                      }`}
                    />
                    <span className="text-base font-semibold text-muted">kg</span>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <label htmlFor="sim-weeks" className="text-[15px] font-semibold">
                      Entro
                    </label>
                    <p className="text-[15px] font-bold">{formatShortDate(simSettings.target_date)}</p>
                  </div>
                  <input
                    id="sim-weeks"
                    type="range"
                    min={MIN_WEEKS}
                    max={MAX_WEEKS}
                    step={1}
                    value={sliderWeeks}
                    onChange={(e) => setSimWeeks(Number(e.target.value))}
                    className="mt-2 h-11 w-full accent-brand"
                  />
                  <p className="text-sm text-muted">
                    {sliderWeeks} settimane · circa {formatKg(summary.totalMonths).replace(',0', '')} mesi dalla partenza
                  </p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="rounded-[20px] border border-line px-4 py-3.5">
                  <p className="text-sm font-medium text-muted">Ritmo necessario da oggi</p>
                  <p className="mt-1 text-xl font-extrabold tracking-tight">
                    {summary.requiredPerWeek === null
                      ? 'Data già passata'
                      : summary.requiredPerWeek === 0
                        ? 'Obiettivo raggiunto'
                        : `−${formatKg(summary.requiredPerWeek)} kg a settimana`}
                  </p>
                  {pace && (
                    <p
                      className={`mt-1 text-[15px] font-medium ${
                        pace.tone === 'warn' ? 'text-amber-800 dark:text-amber-300' : 'text-brand-ink'
                      }`}
                    >
                      {pace.text}
                    </p>
                  )}
                </div>

                <div className="rounded-[20px] border border-line px-4 py-3.5">
                  <p className="text-sm font-medium text-muted">Al ritmo del piano ({settings.deficit_kcal} kcal al giorno)</p>
                  <p className="mt-1 text-xl font-extrabold tracking-tight">
                    −{formatKg(summary.planPerWeek)} kg a settimana
                  </p>
                  <p className="mt-1 text-[15px] text-muted">
                    Arrivi al peso forma il {formatShortDate(summary.planArrival)}.
                  </p>
                </div>

                <p className="px-1 text-sm leading-snug text-muted">
                  Stima teorica: circa 7.700 kcal di deficit per ogni kg. Il peso reale oscilla di giorno in giorno,
                  conta la tendenza.
                </p>
              </div>

              {dirty && (
                <div className="mt-4 flex gap-3">
                  <button
                    type="button"
                    onClick={handleSaveGoal}
                    disabled={savingGoal}
                    className="h-14 flex-1 rounded-2xl bg-brand text-base font-bold text-white disabled:opacity-60"
                  >
                    {savingGoal ? 'Salvataggio…' : 'Salva come obiettivo'}
                  </button>
                  <button
                    type="button"
                    onClick={resetSimulation}
                    className="h-14 rounded-2xl px-5 text-base font-semibold text-brand"
                  >
                    Annulla
                  </button>
                </div>
              )}
            </section>

            {/* Storico */}
            <section aria-label="Storico" className="mx-5 mt-8">
              <h2 className="text-xl font-bold">Storico</h2>
              <ul className="mt-2">
                {[...summary.points].reverse().map((p, idx, arr) => {
                  const prev = arr[idx + 1] ?? null;
                  const entry = entries.find((e) => e.measured_on === p.date);
                  return (
                    <li key={p.date} className="flex min-h-14 items-center justify-between gap-3 border-t border-line">
                      <div>
                        <p className="text-base font-medium">{formatWeekdayDate(p.date)}</p>
                        {!entry && <p className="text-sm text-muted">Partenza</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        {prev && (
                          <span className="text-sm font-medium text-muted">{formatKgSigned(p.kg - prev.kg)}</span>
                        )}
                        <span className="text-base font-bold">{formatKg(p.kg)} kg</span>
                        {entry ? (
                          <button
                            type="button"
                            onClick={() => handleDelete(entry.id, entry.measured_on)}
                            aria-label={`Elimina la misura del ${formatShortDate(entry.measured_on)}`}
                            className="flex size-11 items-center justify-center rounded-full text-muted"
                          >
                            <svg
                              width="20"
                              height="20"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="1.9"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              aria-hidden="true"
                            >
                              <path d="M4 7h16M10 11v6M14 11v6M6 7l1 12h10l1-12M9 7V4h6v3" />
                            </svg>
                          </button>
                        ) : (
                          <span className="size-11" aria-hidden="true" />
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>

            <PushToggle />
          </>
        )}
      </div>

      <BottomNav active="peso" />
    </div>
  );
}
