import pool from './db';

// Una riga per ogni dispositivo che ha attivato i promemoria
const PUSH_DDL = `
CREATE TABLE IF NOT EXISTS push_subscription (
  endpoint text PRIMARY KEY,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
`;

let ready: Promise<void> | null = null;

export function ensurePushTable(): Promise<void> {
  if (!ready) {
    ready = pool
      .query(PUSH_DDL)
      .then(() => undefined)
      .catch((error) => {
        ready = null;
        throw error;
      });
  }
  return ready;
}
