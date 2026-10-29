import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Cerca il cookie segreto
  const authCookie = request.cookies.get('dietos_auth');

  // Se non c'è il cookie e l'utente non è già sulla pagina di login, lo reindirizziamo
  if (!authCookie && !request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Diciamo al middleware di proteggere tutto TRANNE le icone e i file di sistema (serve per la PWA)
export const config = {
  matcher: ['/((?!api/auth|api/cron|sw.js|splash|_next/static|_next/image|favicon.ico|manifest.json|manifest.webmanifest|icon|apple-icon).*)'],
};
