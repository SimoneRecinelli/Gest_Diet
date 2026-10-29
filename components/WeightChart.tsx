import { daysBetween, formatDayMonth } from '../lib/dates';
import { formatKg } from '../lib/format';
import type { Point, WeightSettings } from '../lib/weight';

const W = 360;
const H = 240;
const PAD = { l: 44, r: 16, t: 18, b: 30 };

type Props = {
  settings: WeightSettings;
  points: Point[];
  projectionEnd: Point | null;
  todayKey: string | null;
};

function tickStep(range: number): number {
  if (range <= 6) return 1;
  if (range <= 14) return 2;
  return 5;
}

export default function WeightChart({ settings, points, projectionEnd, todayKey }: Props) {
  const last = points[points.length - 1];

  // Asse orizzontale: dalla partenza alla data più lontana tra obiettivo, ultima misura e proiezione
  let xEnd = settings.target_date > last.date ? settings.target_date : last.date;
  if (projectionEnd && projectionEnd.date > xEnd) xEnd = projectionEnd.date;
  const totalDays = Math.max(7, daysBetween(settings.start_date, xEnd));
  const plotW = W - PAD.l - PAD.r;
  const plotH = H - PAD.t - PAD.b;
  const x = (date: string) => PAD.l + (daysBetween(settings.start_date, date) / totalDays) * plotW;

  // Asse verticale: contiene partenza, obiettivo e tutte le misure
  const kgs = [settings.start_kg, settings.target_kg, ...points.map((p) => p.kg)];
  if (projectionEnd) kgs.push(projectionEnd.kg);
  const yMin = Math.floor(Math.min(...kgs) - 0.5);
  const yMax = Math.max(yMin + 2, Math.ceil(Math.max(...kgs) + 0.5));
  const y = (kg: number) => PAD.t + ((yMax - kg) / (yMax - yMin)) * plotH;

  const step = tickStep(yMax - yMin);
  const yTicks: number[] = [];
  for (let v = Math.ceil(yMin / step) * step; v <= yMax; v += step) yTicks.push(v);

  const xTicks: { date: string; anchor: 'start' | 'middle' | 'end' }[] = [
    { date: settings.start_date, anchor: 'start' },
  ];
  if (daysBetween(settings.start_date, settings.target_date) / totalDays > 0.25) {
    const xt = x(settings.target_date);
    xTicks.push({ date: settings.target_date, anchor: xt > W - 52 ? 'end' : 'middle' });
  }
  // Se al ritmo attuale arrivi dopo la data obiettivo, segna anche quella data
  if (
    projectionEnd &&
    projectionEnd.kg === settings.target_kg &&
    daysBetween(settings.target_date, projectionEnd.date) > 45
  ) {
    xTicks.push({ date: projectionEnd.date, anchor: 'end' });
  }

  const showToday =
    todayKey !== null &&
    daysBetween(settings.start_date, todayKey) >= 0 &&
    daysBetween(todayKey, xEnd) >= 0;

  const actualPath = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'}${x(p.date).toFixed(1)} ${y(p.kg).toFixed(1)}`)
    .join(' ');

  const lastY = y(last.kg);
  const labelY = lastY - 12 < PAD.t ? lastY + 20 : lastY - 11;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`Grafico del peso: partenza ${formatKg(settings.start_kg)} kg, ultima misura ${formatKg(last.kg)} kg, obiettivo ${formatKg(settings.target_kg)} kg`}
      className="block h-auto w-full"
    >
      {/* Griglia e scala dei kg */}
      {yTicks.map((v) => (
        <g key={v}>
          <line x1={PAD.l} x2={W - PAD.r} y1={y(v)} y2={y(v)} className="stroke-line" strokeWidth={1} />
          <text x={PAD.l - 8} y={y(v) + 4} textAnchor="end" fontSize={12} className="fill-muted">
            {v}
          </text>
        </g>
      ))}

      {/* Peso forma */}
      <line
        x1={PAD.l}
        x2={W - PAD.r}
        y1={y(settings.target_kg)}
        y2={y(settings.target_kg)}
        className="stroke-brand"
        strokeWidth={1}
        opacity={0.35}
      />
      <text
        x={PAD.l + 6}
        y={y(settings.target_kg) - 6}
        textAnchor="start"
        fontSize={12}
        fontWeight={600}
        className="fill-brand-ink"
        stroke="white"
        strokeWidth={4}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        Peso forma {formatKg(settings.target_kg)}
      </text>

      {/* Oggi */}
      {showToday && todayKey && (
        <g>
          <line
            x1={x(todayKey)}
            x2={x(todayKey)}
            y1={PAD.t}
            y2={H - PAD.b}
            className="stroke-muted"
            strokeWidth={1}
            strokeDasharray="3 4"
            opacity={0.6}
          />
          <text x={x(todayKey)} y={PAD.t - 5} textAnchor="middle" fontSize={11} className="fill-muted">
            oggi
          </text>
        </g>
      )}

      {/* Obiettivo: retta dalla partenza al peso forma */}
      <line
        x1={x(settings.start_date)}
        y1={y(settings.start_kg)}
        x2={x(settings.target_date)}
        y2={y(settings.target_kg)}
        className="stroke-brand"
        strokeWidth={2}
        strokeDasharray="7 5"
        strokeLinecap="round"
      />

      {/* Al ritmo attuale */}
      {projectionEnd && (
        <line
          x1={x(last.date)}
          y1={lastY}
          x2={x(projectionEnd.date)}
          y2={y(projectionEnd.kg)}
          className="stroke-muted"
          strokeWidth={2.5}
          strokeDasharray="1 6"
          strokeLinecap="round"
        />
      )}

      {/* Misure reali */}
      {points.length > 1 && (
        <path
          d={actualPath}
          fill="none"
          className="stroke-ink"
          strokeWidth={2.5}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
      )}
      {points.map((p, i) => {
        const isLast = i === points.length - 1;
        return (
          <circle
            key={p.date}
            cx={x(p.date)}
            cy={y(p.kg)}
            r={isLast ? 5.5 : 4}
            className={isLast ? 'fill-ink stroke-white' : 'fill-white stroke-ink'}
            strokeWidth={2}
          />
        );
      })}
      <text
        x={Math.min(x(last.date), W - PAD.r - 12)}
        y={labelY}
        textAnchor="middle"
        fontSize={13}
        fontWeight={700}
        className="fill-ink"
        stroke="white"
        strokeWidth={4}
        paintOrder="stroke"
        strokeLinejoin="round"
      >
        {formatKg(last.kg)}
      </text>

      {/* Date sull'asse orizzontale */}
      {xTicks.map((t) => (
        <text
          key={t.date}
          x={x(t.date)}
          y={H - 8}
          textAnchor={t.anchor}
          fontSize={12}
          className="fill-muted"
        >
          {formatDayMonth(t.date)}
        </text>
      ))}
    </svg>
  );
}
