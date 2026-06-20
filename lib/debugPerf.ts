// Performans logları temizlendi — fonksiyonlar no-op olarak korunuyor
// (import'lar bozulmasın diye stub'lar bırakıldı)

export function useRenderTracker(_name: string) {}
export function useFocusTimer(_screen: string) {}
export function useJSThreadProbe(_label?: string) {}
export function createProfilerHandler(_name: string) {
  return () => {};
}
