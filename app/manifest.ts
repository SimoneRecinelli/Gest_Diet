import { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'DietOS Nutrizione',
    short_name: 'DietOS',
    description: 'Il mio gestionale per la dieta',
    start_url: '/',
    display: 'standalone', /* Questo rimuove la barra di Safari e la fa sembrare un'app vera! */
    background_color: '#F8FAFC',
    theme_color: '#14B8A6', /* Il nostro bellissimo Teal */
    icons: [
      {
        src: '/icon-192x192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512x512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}