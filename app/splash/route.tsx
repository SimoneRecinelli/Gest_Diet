import { ImageResponse } from 'next/og';

// Schermata di avvio per iPhone: sfondo pieno con l'icona dell'app al centro
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const w = Math.min(Math.max(Number(searchParams.get('w')) || 1170, 320), 1600);
  const h = Math.min(Math.max(Number(searchParams.get('h')) || 2532, 480), 3200);
  const dark = searchParams.get('t') === 'dark';
  const tile = Math.round(w * 0.24);

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: dark ? '#0E1417' : '#FFFFFF',
        }}
      >
        <div
          style={{
            width: tile,
            height: tile,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: Math.round(tile * 0.25),
            background: 'linear-gradient(to bottom right, #2DD4BF, #0F766E)',
          }}
        >
          <svg
            style={{ transform: `translateY(${-Math.round(tile * 0.47 * 0.045)}px)` }}
            width={Math.round(tile * 0.47)}
            height={Math.round(tile * 0.47)}
            viewBox="0 0 24 24"
            fill="none"
            stroke="white"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M12 20.94c1.5 0 2.75 1.06 4 1.06 3 0 6-8 6-12.22A4.91 4.91 0 0 0 17 5c-2.22 0-4 1.44-5 2-1-.56-2.78-2-5-2a4.9 4.9 0 0 0-5 4.78C2 14 5 22 8 22c1.25 0 2.5-1.06 4-1.06Z" />
            <path d="M10 2c1 .5 2 2 2 5" />
          </svg>
        </div>
      </div>
    ),
    {
      width: w,
      height: h,
      headers: { 'Cache-Control': 'public, max-age=31536000, immutable' },
    },
  );
}
