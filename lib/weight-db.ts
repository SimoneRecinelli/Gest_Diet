import pool from './db';
import type { WeightData } from './weight';

// Le tabelle vengono create alla prima richiesta: non serve lanciare SQL a mano su Neon.
// Valori iniziali: partenza 89,9 kg il 12/10/2026, peso forma 76,6 kg.
// La data obiettivo di partenza (22/02/2027) è quella che si ottiene col deficit del piano
// (circa 800 kcal al giorno): si cambia dalla simulazione nella pagina Peso.
export const WEIGHT_DDL = `
CREATE TABLE IF NOT EXISTS weight_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  start_date date NOT NULL,
  start_kg numeric(5,1) NOT NULL,
  target_kg numeric(5,1) NOT NULL,
  target_date date NOT NULL,
  deficit_kcal integer NOT NULL DEFAULT 800
);
CREATE TABLE IF NOT EXISTS weight_entry (
  id serial PRIMARY KEY,
  measured_on date NOT NULL UNIQUE,
  kg numeric(5,1) NOT NULL CHECK (kg > 30 AND kg < 300),
  created_at timestamptz NOT NULL DEFAULT now()
);
INSERT INTO weight_settings (id, start_date, start_kg, target_kg, target_date, deficit_kcal)
VALUES (1, '2026-10-12', 89.9, 76.6, '2027-02-22', 800)
ON CONFLICT (id) DO NOTHING;
`;

let ready: Promise<void> | null = null;

// Esegue la creazione una sola volta per istanza; se fallisce riprova alla richiesta dopo
export function ensureWeightTables(): Promise<void> {
  if (!ready) {
    ready = pool
      .query(WEIGHT_DDL)
      .then(() => undefined)
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}

export const SETTINGS_SQL = `
  SELECT to_char(start_date, 'YYYY-MM-DD') AS start_date,
         start_kg::float8 AS start_kg,
         target_kg::float8 AS target_kg,
         to_char(target_date, 'YYYY-MM-DD') AS target_date,
         deficit_kcal
  FROM weight_settings WHERE id = 1`;

export const ENTRIES_SQL = `
  SELECT id,
         to_char(measured_on, 'YYYY-MM-DD') AS measured_on,
         kg::float8 AS kg
  FROM weight_entry ORDER BY measured_on ASC`;

export async function readWeight(): Promise<WeightData> {
  await ensureWeightTables();
  const [settings, entries] = await Promise.all([pool.query(SETTINGS_SQL), pool.query(ENTRIES_SQL)]);
  return { settings: settings.rows[0], entries: entries.rows };
}
