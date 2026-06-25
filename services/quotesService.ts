/**
 * quotesService.ts
 * Özlü sözleri Supabase'den çeker.
 * İnternet yoksa (veya hata olursa) yerel sabit dizilere fallback yapar.
 */

import { supabase } from '@/lib/supabase';
import {
  EXPLORE_QUOTE_POOL,
  type DailyQuote,
} from '@/constants/storyData';
import {
  HOME_WISDOM_POOL,
  type WisdomQuote,
} from '@/constants/homeData';

// ─── Tipler ─────────────────────────────────────────────────────────────────

export interface Quote {
  id: number;
  text: string;
  author: string;
  category: string;
  pool: 'explore' | 'home';
}

// ─── Explore havuzu (Günün Sözü) ─────────────────────────────────────────────

/**
 * Keşfet ekranındaki "Günün Sözü" için sözleri çeker.
 * Hata / boş dönüşte yerel EXPLORE_QUOTE_POOL'u döner.
 */
export async function fetchExploreQuotes(): Promise<DailyQuote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('id, text, author, category')
      .eq('pool', 'explore')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('[quotesService] explore: Supabase hatası, fallback kullanılıyor.', error?.message);
      return EXPLORE_QUOTE_POOL;
    }

    return data.map((q) => ({ text: q.text, author: q.author }));
  } catch (err) {
    console.warn('[quotesService] explore: Ağ hatası, fallback kullanılıyor.', err);
    return EXPLORE_QUOTE_POOL;
  }
}

// ─── Home havuzu (Günlük Hikmet) ─────────────────────────────────────────────

/**
 * Ana sayfadaki "Günlük Hikmet" için sözleri çeker.
 * Hata / boş dönüşte yerel HOME_WISDOM_POOL'u döner.
 */
export async function fetchHomeQuotes(): Promise<WisdomQuote[]> {
  try {
    const { data, error } = await supabase
      .from('quotes')
      .select('id, text, author')
      .eq('pool', 'home')
      .eq('is_active', true)
      .order('id', { ascending: true });

    if (error || !data || data.length === 0) {
      console.warn('[quotesService] home: Supabase hatası, fallback kullanılıyor.', error?.message);
      return HOME_WISDOM_POOL;
    }

    return data.map((q) => ({ text: q.text, author: q.author }));
  } catch (err) {
    console.warn('[quotesService] home: Ağ hatası, fallback kullanılıyor.', err);
    return HOME_WISDOM_POOL;
  }
}

// ─── Yardımcı: epoch-gün bazlı söz seç ──────────────────────────────────────

/**
 * Verilen sözler dizisinden bugünün gün indeksine göre bir söz seçer.
 * Her gün farklı bir söz döner, döngüsel.
 */
export function pickDailyQuote<T>(pool: T[]): T {
  if (pool.length === 0) return { text: '', author: '' } as T;
  const epochDay = Math.floor(Date.now() / (24 * 60 * 60 * 1000));
  return pool[epochDay % pool.length];
}
