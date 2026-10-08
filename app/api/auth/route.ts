import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    // Controlla contro la variabile d'ambiente
    if (password === process.env.APP_PASSWORD) {
      // 1. Creiamo prima la risposta di successo
      const response = NextResponse.json({ success: true });
      
      // 2. Impostiamo il cookie direttamente sulla risposta
      response.cookies.set('dietos_auth', 'authenticated', { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30, // 30 giorni
        path: '/'
      });
      
      // 3. Ritorniamo la risposta con il cookie agganciato
      return response;
    }
    
    return NextResponse.json({ success: false, message: 'Password errata' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Errore interno' }, { status: 500 });
  }
}