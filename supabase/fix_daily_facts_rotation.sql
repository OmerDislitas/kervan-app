-- =====================================================
-- GÜNLÜK HAP BİLGİLERİ: SIRALI DÖNGÜ SİSTEMİ
-- Bilgiler havuzdan sırayla seçilir (round-robin).
-- Havuz bitince başa döner.
-- =====================================================

-- ─── 1. generate_daily_facts() fonksiyonunu yeniden yaz ──────────────────────
CREATE OR REPLACE FUNCTION public.generate_daily_facts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date   DATE := CURRENT_DATE;
  total_pool   INT;
  per_day      INT := 17;            -- Her gün seçilecek bilgi sayısı
  day_number   INT;                  -- Başlangıçtan bu yana kaçıncı gün
  start_offset INT;                  -- Havuzdaki başlangıç pozisyonu
  selected     JSONB;
BEGIN
  -- Bugün için varsa sil
  DELETE FROM public.daily_facts WHERE fact_date = today_date;

  -- Havuz büyüklüğünü öğren
  SELECT COUNT(*) INTO total_pool FROM public.facts_pool;

  -- Referans tarihinden bu yana geçen gün sayısı
  -- (2025-01-01'den itibaren sayar, istediğiniz tarihi koyabilirsiniz)
  day_number := (today_date - '2025-01-01'::DATE);

  -- Havuzdaki başlangıç pozisyonu (0-indexed, döngüsel)
  start_offset := (day_number * per_day) % total_pool;

  -- Sıralı seçim: ID'ye göre sıralı havuzdan offset'ten itibaren 17 bilgi al
  -- Wrap-around ile havuz bitince başa döner
  WITH ordered_pool AS (
    SELECT 
      id, title, description AS "desc", category, image_url AS image, color,
      ROW_NUMBER() OVER (ORDER BY id) - 1 AS row_idx  -- 0-indexed sıra
    FROM public.facts_pool
  ),
  selected_facts AS (
    SELECT id, title, "desc", category, image, color
    FROM ordered_pool
    WHERE (row_idx - start_offset + total_pool) % total_pool < per_day
    ORDER BY (row_idx - start_offset + total_pool) % total_pool
  )
  SELECT jsonb_agg(row_to_json(f.*))
  INTO selected
  FROM selected_facts f;

  INSERT INTO public.daily_facts (fact_date, facts, generated_at)
  VALUES (today_date, selected, NOW());

  RAISE NOTICE 'Günlük bilgiler oluşturuldu: % (% bilgi, offset: %)', 
    today_date, jsonb_array_length(selected), start_offset;
END;
$$;

-- ─── 2. Bugün için hemen çalıştır ───────────────────────────────────────────
SELECT public.generate_daily_facts();

-- ─── 3. pg_cron job'ı güncelle (varsa) ──────────────────────────────────────
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    PERFORM cron.unschedule('generate-daily-facts')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-facts'
    );

    PERFORM cron.schedule(
      'generate-daily-facts',
      '0 14 * * *',
      'SELECT public.generate_daily_facts()'
    );
    RAISE NOTICE 'pg_cron job güncellendi: Her gün 14:00 UTC (17:00 TR)';
  ELSE
    RAISE NOTICE 'pg_cron aktif değil — manuel çalıştırma gerekir.';
  END IF;
END;
$$;

-- ─── 4. Doğrulama ──────────────────────────────────────────────────────────
-- Bugünkü seçimi kontrol:
-- SELECT fact_date, jsonb_array_length(facts) AS bilgi_sayisi FROM daily_facts WHERE fact_date = CURRENT_DATE;
--
-- Havuzdaki sırayı kontrol:
-- SELECT id, title, category FROM facts_pool ORDER BY id;
