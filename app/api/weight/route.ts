import { NextResponse } from 'next/server';
import pool from '../../../lib/db';
import { ensureWeightTables, readWeight } from '../../../lib/weight-db';

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function isValidDate(value: unknown): value is string {
  if (typeof value !== 'string' || !DATE_RE.test(value)) return false;
  const d = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

function isValidKg(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 30 && value < 300;
}

async function readBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    return body && typeof body === 'object' ? (body as Record<string, unknown>) : null;
  } catch {
    return null;
  }
}

function bad(message: string) {
  return NextResponse.json({ error: message }, { status: 400 });
}

function failure(error: unknown) {
  console.error(error);
  return NextResponse.json({ error: 'Errore DB' }, { status: 500 });
}

// Impostazioni e misure registrate
export async function GET() {
  try {
    return NextResponse.json(await readWeight());
  } catch (error) {
    return failure(error);
  }
}

// Registra (o aggiorna) il peso di un giorno: { measured_on: "2026-10-26", kg: 88.9 }
export async function POST(request: Request) {
  const body = await readBody(request);
  if (!body) return bad('Richiesta non valida');

  const { measured_on: date, kg } = body;
  if (!isValidDate(date)) return bad('Data non valida');
  if (!isValidKg(kg)) return bad('Peso non valido');

  // Un giorno di tolleranza per i fusi orari, ma niente date nel futuro
  const latest = new Date(Date.now() + 36 * 3600 * 1000).toISOString().slice(0, 10);
  if (date > latest) return bad('La data non può essere nel futuro');

  try {
    await ensureWeightTables();
    await pool.query(
      `INSERT INTO weight_entry (measured_on, kg) VALUES ($1, $2)
       ON CONFLICT (measured_on) DO UPDATE SET kg = EXCLUDED.kg`,
      [date, Math.round(kg * 10) / 10],
    );
    return NextResponse.json(await readWeight());
  } catch (error) {
    return failure(error);
  }
}

// Elimina una misura: DELETE /api/weight?id=3
export async function DELETE(request: Request) {
  const id = Number(new URL(request.url).searchParams.get('id'));
  if (!Number.isInteger(id) || id <= 0) return bad('Id non valido');

  try {
    await ensureWeightTables();
    await pool.query('DELETE FROM weight_entry WHERE id = $1', [id]);
    return NextResponse.json(await readWeight());
  } catch (error) {
    return failure(error);
  }
}

// Cambia l'obiettivo: { target_kg: 76.6, target_date: "2027-02-22", deficit_kcal?: 800 }
export async function PATCH(request: Request) {
  const body = await readBody(request);
  if (!body) return bad('Richiesta non valida');

  const { target_kg: targetKg, target_date: targetDate, deficit_kcal: deficit } = body;
  if (!isValidKg(targetKg)) return bad('Peso forma non valido');
  if (!isValidDate(targetDate)) return bad('Data obiettivo non valida');
  if (
    deficit !== undefined &&
    !(typeof deficit === 'number' && Number.isInteger(deficit) && deficit >= 0 && deficit <= 2000)
  ) {
    return bad('Deficit non valido');
  }

  try {
    await ensureWeightTables();
    const result = await pool.query(
      `UPDATE weight_settings
       SET target_kg = $1,
           target_date = $2,
           deficit_kcal = COALESCE($3, deficit_kcal)
       WHERE id = 1 AND $2::date > start_date`,
      [Math.round(targetKg * 10) / 10, targetDate, deficit ?? null],
    );
    if (result.rowCount === 0) return bad('La data obiettivo deve essere dopo la partenza');
    return NextResponse.json(await readWeight());
  } catch (error) {
    return failure(error);
  }
}
