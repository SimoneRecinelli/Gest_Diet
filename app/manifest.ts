import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DietOS Nutrizione',
    short_name: 'DietOS',
    description: 'Il mio gestionale per la dieta',
    start_url: '/',
    display: 'standalone', /* Rimuove la barra del browser: si apre come un'app vera */
    lang: 'it',
    background_color: '#FFFFFF',
    theme_color: '#FFFFFF',
    icons: [
      {
        // Generata da app/icon.tsx (512x512)
        src: '/icon',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
