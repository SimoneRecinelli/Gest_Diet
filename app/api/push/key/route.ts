import { NextResponse } from 'next/server';

// Chiave pubblica VAPID: serve al telefono per iscriversi alle notifiche
export async function GET() {
  const key = process.env.VAPID_PUBLIC_KEY;
  if (!key) return NextResponse.json({ error: 'Notifiche non configurate' }, { status: 503 });
  return NextResponse.json({ key });
}
