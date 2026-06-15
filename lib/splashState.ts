/**
 * Splash animasyonunun tamamlandığını _layout.tsx'e bildiren
 * basit bir köprü modülü. Zustand veya Context gerektirmez.
 */

let _done = false;
const _listeners: Array<() => void> = [];

/** index.tsx tarafından animasyon bitince çağrılır */
export function markSplashDone(): void {
  if (_done) return;
  _done = true;
  _listeners.forEach(fn => fn());
  _listeners.length = 0;
}

/** _layout.tsx tarafından routing için dinleyici eklemek amacıyla çağrılır */
export function onSplashDone(fn: () => void): () => void {
  if (_done) {
    fn();
    return () => {};
  }
  _listeners.push(fn);
  return () => {
    const idx = _listeners.indexOf(fn);
    if (idx !== -1) _listeners.splice(idx, 1);
  };
}
