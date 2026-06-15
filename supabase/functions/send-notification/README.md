# send-notification (Edge Function)

Push bildirimlerini güvenli şekilde gönderir. Token'lar istemciye açılmaz;
başlık/gövde sunucudaki sabit şablonlardan üretilir (oltalama/içerik
sahteciliği engellenir).

## Şablonlar (istemci yalnızca `type` seçer)
- `follow-request`
- `new-follower`
- `follow-accepted`
- `comment-reply`
- `comment-like`

## İstemci kullanımı
`lib/notificationService.ts` içindeki `sendPushNotification(targetUserId, _title, _body, { type, ...data })`
fonksiyonu bu Edge Function'ı `supabase.functions.invoke('send-notification', ...)`
ile çağırır. `_title`/`_body` artık kullanılmaz.

## Deploy

```bash
# Supabase CLI kurulu ve proje linkli olmalı:
supabase link --project-ref bttdxqmuynfeehitmhjs
supabase functions deploy send-notification
```

`SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` ortam
değişkenleri Edge Functions runtime'ında otomatik sağlanır; ayrıca tanımlamaya
gerek yoktur.

## Güvenlik notları
- `verify_jwt` varsayılan olarak **açık**tır → yalnızca giriş yapmış kullanıcılar çağırabilir.
- Çağıran kimliği JWT'den alınır; kendine bildirim gönderimi no-op'tur.
- Yeni bildirim türü gerekirse `TEMPLATES` sözlüğüne ekleyin (istemci serbest metin gönderemez).
