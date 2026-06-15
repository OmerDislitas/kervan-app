// @ts-nocheck — Bu dosya Supabase Edge (Deno) runtime'ında çalışır; React
// Native/TypeScript proje derlemesine dahil değildir. Deno global'leri ve
// uzak (esm.sh) importları RN tsconfig'inde tanınmadığı için tip kontrolü kapalı.
// ============================================================
// Kervan — Push Bildirimi Edge Function (Y-2 düzeltmesi)
// ------------------------------------------------------------
// Amaç: Push token'ları istemciye ASLA açmadan, yalnızca giriş
// yapmış kullanıcıların ÖNCEDEN TANIMLI şablonlarla bildirim
// göndermesine izin vermek.
//
// Güvenlik:
//   - verify_jwt = true (varsayılan): yalnızca authenticated çağırır.
//   - Başlık/gövde İSTEMCİDEN ALINMAZ; sunucu sabit şablondan üretir
//     (içerik sahteciliği / oltalama engellenir).
//   - Hedefin push_token'ı service_role ile sunucuda okunur; yanıtta
//     ASLA döndürülmez.
//   - Kendine bildirim gönderme engellenir.
//
// Deploy:
//   supabase functions deploy send-notification
// ============================================================

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// ÖNCEDEN TANIMLI ŞABLONLAR — istemci yalnızca "type" seçebilir.
const TEMPLATES: Record<string, { title: string; body: string }> = {
  'follow-request':  { title: 'Yeni Takip İsteği! 👥',        body: 'Biri sana takip isteği gönderdi.' },
  'new-follower':    { title: 'Yeni Bir Takipçi! 👥',         body: 'Biri seni takip etmeye başladı.' },
  'follow-accepted': { title: 'Takip İsteğin Kabul Edildi! 👥', body: 'Takip isteğin kabul edildi.' },
  'comment-reply':   { title: 'Yorumuna Yanıt Geldi! 💬',     body: 'Paylaştığın yoruma yeni bir yanıt yazıldı.' },
  'comment-like':    { title: 'Yorumun Beğenildi! ❤️',        body: 'Yorumun topluluktan bir beğeni aldı.' },
};

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_ROLE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ANON_KEY = Deno.env.get('SUPABASE_ANON_KEY')!;

  // 1) Çağıran kullanıcıyı doğrula (JWT). Authorization header zorunlu.
  const authHeader = req.headers.get('Authorization') ?? '';
  if (!authHeader.startsWith('Bearer ')) {
    return json({ error: 'Yetkisiz' }, 401);
  }

  const userClient = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: userData, error: userErr } = await userClient.auth.getUser();
  if (userErr || !userData?.user) {
    return json({ error: 'Geçersiz oturum' }, 401);
  }
  const callerId = userData.user.id;

  // 2) Girdiyi ayrıştır ve doğrula.
  let payload: { targetUserId?: string; type?: string; data?: Record<string, unknown> };
  try {
    payload = await req.json();
  } catch {
    return json({ error: 'Geçersiz istek gövdesi' }, 400);
  }

  const { targetUserId, type } = payload;
  if (!targetUserId || !type) {
    return json({ error: 'targetUserId ve type zorunludur' }, 400);
  }
  const template = TEMPLATES[type];
  if (!template) {
    return json({ error: 'Bilinmeyen bildirim tipi' }, 400);
  }
  if (targetUserId === callerId) {
    // Kendine bildirim gönderme: sessizce başarı dön (no-op).
    return json({ ok: true, skipped: 'self' });
  }

  // 3) Hedefin push token'ını service_role ile SUNUCUDA oku.
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE);
  const { data: profile, error: profErr } = await admin
    .from('profiles')
    .select('push_token')
    .eq('id', targetUserId)
    .single();

  if (profErr || !profile?.push_token) {
    // Token yok / kullanıcı bildirimleri kapalı — istemciye token sızdırma.
    return json({ ok: true, delivered: false });
  }

  // 4) Expo Push API'ye gönder. Başlık/gövde sunucu şablonundan.
  const message = {
    to: profile.push_token,
    sound: 'default',
    title: template.title,
    body: template.body,
    data: { type, ...(payload.data ?? {}) },
  };

  const expoRes = await fetch('https://exp.host/--/api/v2/push/send', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Accept-encoding': 'gzip, deflate',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(message),
  });

  if (!expoRes.ok) {
    const text = await expoRes.text();
    return json({ ok: false, error: 'Expo gönderimi başarısız', detail: text }, 502);
  }

  return json({ ok: true, delivered: true });
});
