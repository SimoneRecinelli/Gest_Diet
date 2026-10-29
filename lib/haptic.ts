// Vibrazione leggera. Android usa navigator.vibrate; su iPhone (iOS 18+) il tocco su
// un interruttore nativo (checkbox "switch") produce la vibrazione di sistema.
export function haptic(): void {
  if (typeof document === 'undefined') return;
  try {
    if (typeof navigator.vibrate === 'function') {
      navigator.vibrate(10);
      return;
    }
    const label = document.createElement('label');
    label.setAttribute('aria-hidden', 'true');
    label.style.cssText = 'position:fixed;left:-100px;top:-100px;opacity:0;pointer-events:none';
    const input = document.createElement('input');
    input.type = 'checkbox';
    input.setAttribute('switch', '');
    label.appendChild(input);
    document.body.appendChild(label);
    label.click();
    label.remove();
  } catch {
    // Nessuna vibrazione disponibile: pazienza
  }
}
