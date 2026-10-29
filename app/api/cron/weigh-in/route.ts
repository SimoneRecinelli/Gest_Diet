import { NextResponse } from 'next/server';
import webpush from 'web-push';
import pool from '../../../../lib/db';
import { ensurePushTable } from '../../../../lib/push-db';
import { ensureWeightTables } from '../../../../lib/weight-db';
import { dayIdOf, weekKeys } from '../../../../lib/dates';

// Chiamata da Vercel Cron (lunedì-mercoledì mattina): avvisa solo se questa settimana manca la pesata
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Non autorizzato' }, { status: 401 });
  }

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  if (!publicKey || !privateKey) {
    return NextResponse.json({ error: 'Chiavi VAPID mancanti' }, { status: 503 });
  }
  webpush.setVapidDetails(process.env.VAPID_SUBJECT || 'mailto:simonerecinelli@gmail.com', publicKey, privateKey);

  // Data di oggi a Roma (il server gira in UTC)
  const todayKey = new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
  const todayId = dayIdOf(todayKey);
  if (todayId > 3) return NextResponse.json({ sent: 0, reason: 'Fuori dai giorni di promemoria' });

  try {
    await Promise.all([ensureWeightTables(), ensurePushTable()]);
    const weighed = await pool.query('SELECT 1 FROM weight_entry WHERE measured_on = ANY($1::date[]) LIMIT 1', [
      weekKeys(todayKey),
    ]);
    if (weighed.rowCount) return NextResponse.json({ sent: 0, reason: 'Già pesato questa settimana' });

    const subs = await pool.query<{ endpoint: string; p256dh: string; auth: string }>(
      'SELECT endpoint, p256dh, auth FROM push_subscription',
    );
    const payload = JSON.stringify({
      title: todayId === 1 ? 'È lunedì: pesata!' : 'Manca la pesata della settimana',
      body: 'Registra il peso su DietOS, ci vuole un attimo.',
      url: '/peso',
    });

    let sent = 0;
    for (const sub of subs.rows) {
      try {
        await webpush.sendNotification({ endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth } }, payload);
        sent += 1;
      } catch (error) {
        const status = (error as { statusCode?: number }).statusCode;
        // Iscrizione scaduta o revocata: la togliamo
        if (status === 404 || status === 410) {
          await pool.query('DELETE FROM push_subscription WHERE endpoint = $1', [sub.endpoint]);
        } else {
          console.error(error);
        }
      }
    }
    return NextResponse.json({ sent });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'Errore' }, { status: 500 });
  }
}
