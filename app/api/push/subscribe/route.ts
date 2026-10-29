import { NextResponse } from 'next/server';
import pool from '../../../../lib/db';
import { ensurePushTable } from '../../../../lib/push-db';

type Sub = { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } };

export async function POST(request: Request) {
  let body: Sub;
  try {
    body = (await request.json()) as Sub;
  } catch {
    return NextResponse.json({ error: 'Richiesta non valida' }, { status: 400 });
  }
  const { endpoint, keys } = body;
  if (typeof endpoint !== 'string' || typeof keys?.p256dh !== 'string' || typeof keys?.auth !== 'string') {
    return NextResponse.json({ error: 'Iscrizione non valida' }, { status: 400 });
  }
  try {
    await ensurePushTable();
    await pool.query(
      `INSERT INTO push_subscription (endpoint, p256dh, auth) VALUES ($1, $2, $3)
       ON CONFLICT (endpoint) DO UPDATE SET p256dh = EXCLUDED.p256dh, auth = EXCLUDED.auth`,
      [endpoint, keys.p256dh, keys.auth],
    );
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore DB' }, { status: 500 });
  }
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const endpoint = searchParams.get('endpoint');
  if (!endpoint) return NextResponse.json({ error: 'Manca endpoint' }, { status: 400 });
  try {
    await ensurePushTable();
    await pool.query('DELETE FROM push_subscription WHERE endpoint = $1', [endpoint]);
    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore DB' }, { status: 500 });
  }
}
