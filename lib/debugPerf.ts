/**
 * Performans debug araçları — yalnızca __DEV__ modunda aktif.
 * Production build'de tüm fonksiyonlar no-op'a dönüşür, bundle'a ek yük girmez.
 *
 * KULLANIM:
 *   useFocusTimer('HomeScreen')        → tab'a tıklanandan ilk commit'e kadar geçen süre
 *   useRenderTracker('CompassCard')    → hangi bileşen kaç kez ve ne sıklıkta render oluyor
 *   useJSThreadProbe()                 → JS thread'i bloke eden operasyonları tespit eder
 *   createProfilerHandler('Screen')    → React.Profiler onRender callback'i
 *
 * KONSOL FİLTRE KISAYOLLARI:
 *   🔴 RENDER  → gereksiz render tespit
 *   🟡 FOCUS   → tab focus başlangıcı
 *   🟢 PAINT   → focus'tan ilk commit'e ms
 *   🔥 JSLAG   → JS thread gecikmesi (>33ms = dropped frame)
 *   📊 PROFIL  → React Profiler actual/base duration
 */

import React from 'react';
import { useFocusEffect } from '@react-navigation/native';

const ENABLED = typeof __DEV__ !== 'undefined' && __DEV__;

// ─── Render Tracker ──────────────────────────────────────────────────────────
// Her render'da: bileşen adı, toplam render sayısı, son render'dan bu yana geçen süre.
// Süre kısaysa aynı frame içinde birden fazla render oluyor demektir (state cascade).
export function useRenderTracker(name: string) {
  if (!ENABLED) return;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const count = React.useRef(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const lastTs = React.useRef(performance.now());

  count.current += 1;
  const now = performance.now();
  const delta = now - lastTs.current;
  lastTs.current = now;

  // Δ < 5ms → aynı event loop tick'inde birden fazla render (genellikle sorun işareti)
  const tag = delta < 5 && count.current > 1 ? ' ⚡CASCADE' : '';
  console.log(`[🔴 RENDER] ${name} ×${count.current}  Δ${delta.toFixed(1)}ms${tag}`);
}

// ─── Focus → Paint Timer ─────────────────────────────────────────────────────
// Ölçülen şey: "useFocusEffect tetiklendi" → "useLayoutEffect (commit) tamamlandı"
// Bu süre tab geçişinin kullanıcı tarafından hissedilen gecikmesini temsil eder.
export function useFocusTimer(screen: string) {
  if (!ENABLED) return;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const focusAt = React.useRef(0);
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const painted = React.useRef(false);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useFocusEffect(
    // eslint-disable-next-line react-hooks/rules-of-hooks
    React.useCallback(() => {
      focusAt.current = performance.now();
      painted.current = false;
      console.log(`\n[🟡 FOCUS ] ── ${screen} ──`);
      return () => {
        console.log(`[⚫ BLUR  ] ${screen}  (session renders: will reset)`);
      };
    }, [screen])
  );

  // useLayoutEffect: DOM commit bittikten hemen sonra çalışır → gerçek "paint ready" anı
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useLayoutEffect(() => {
    if (focusAt.current > 0 && !painted.current) {
      painted.current = true;
      const ms = (performance.now() - focusAt.current).toFixed(1);
      const flag = parseFloat(ms) > 100 ? '🔥 SLOW' : parseFloat(ms) > 50 ? '⚠️  OK' : '✅ FAST';
      console.log(`[🟢 PAINT ] ${screen} → ${ms}ms  ${flag}`);
    }
  });
}

// ─── JS Thread Lag Probe ─────────────────────────────────────────────────────
// requestAnimationFrame her ~16ms'de bir çalışmalıdır (60fps).
// Beklenen aralık tutturulamamışsa JS thread o süre boyunca bloke olmuştu demektir.
// Tab layout bileşenine eklenir → tüm geçişlerde sürekli ölçüm yapar.
export function useJSThreadProbe(label = 'App') {
  if (!ENABLED) return;
  // eslint-disable-next-line react-hooks/rules-of-hooks
  React.useEffect(() => {
    let lastTs = performance.now();
    let rafId: number;
    let frameCount = 0;
    let dropCount = 0;

    const tick = () => {
      const now = performance.now();
      const gap = now - lastTs;
      lastTs = now;
      frameCount++;

      if (gap > 50) {
        dropCount++;
        console.warn(
          `[🔥 JSLAG ] ${label} — JS blocked ${gap.toFixed(0)}ms  (drop #${dropCount})`
        );
      } else if (gap > 33) {
        console.log(
          `[⚠️  FRAME ] ${label} — slow frame ${gap.toFixed(0)}ms`
        );
      }

      // Her 5 saniyede bir özet
      if (frameCount % 300 === 0) {
        console.log(
          `[📈 PROBE ] ${label} — ${frameCount} frames, ${dropCount} drops so far`
        );
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [label]);
}

// ─── React.Profiler onRender Handler ─────────────────────────────────────────
// React.Profiler bileşenine geçilir.
// actualDuration → o render için harcanan gerçek süre
// baseDuration   → memoization olmadan harcancak tahmini süre (fark büyükse memo işe yarıyor)
export function createProfilerHandler(name: string) {
  if (!ENABLED) {
    return () => {};
  }
  return (
    _id: string,
    phase: 'mount' | 'update' | 'nested-update',
    actualDuration: number,
    baseDuration: number,
  ) => {
    const flag =
      actualDuration > 32 ? '🔥 SLOW ' :
      actualDuration > 16 ? '⚠️  WARN ' : '✅ OK   ';
    const memoGain = baseDuration > 0
      ? `memo-gain:${((1 - actualDuration / baseDuration) * 100).toFixed(0)}%`
      : '';
    console.log(
      `[📊 PROFIL] ${flag} ${name} [${phase}]  actual:${actualDuration.toFixed(1)}ms  base:${baseDuration.toFixed(1)}ms  ${memoGain}`
    );
  };
}
