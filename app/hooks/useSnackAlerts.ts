import { useEffect } from 'react';

export function useSnackAlerts() {
  useEffect(() => {
    // 1. Richiedi i permessi per le notifiche al primo avvio
    const requestNotificationPermission = async () => {
      if (!('Notification' in window)) {
        console.log('Questo browser non supporta le notifiche desktop');
        return;
      }
      
      if (Notification.permission !== 'granted' && Notification.permission !== 'denied') {
        await Notification.requestPermission();
      }
    };

    requestNotificationPermission();

    // 2. Controlla l'orario ogni minuto
    const checkTimeForSnack = () => {
      if (Notification.permission !== 'granted') return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();

      // Alert delle 11:00
      if (hours === 11 && minutes === 0) {
        new Notification('🍏 Spuntino Mattutino!', {
          body: 'È l\'ora del tuo Yogurt Banana Zymil.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });
      }

      // Alert delle 16:00
      if (hours === 16 && minutes === 0) {
        new Notification('🍌 Merenda Time!', {
          body: 'Prendi la tua frutta! Controlla l\'app per le alternative.',
          icon: '/icon-192x192.png',
          badge: '/icon-192x192.png',
        });
      }
    };

    // Esegui il controllo ogni 60 secondi
    const intervalId = setInterval(checkTimeForSnack, 60000);

    // Pulizia dell'intervallo
    return () => clearInterval(intervalId);
  }, []);
}