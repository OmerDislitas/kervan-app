-- ============================================================
-- FikirForum Uygulaması — Özlü Sözler Tablosu
-- Supabase Dashboard > SQL Editor'de çalıştırın
-- ============================================================

-- 1) Tablo oluştur
CREATE TABLE IF NOT EXISTS public.quotes (
  id         serial       PRIMARY KEY,
  text       text         NOT NULL,
  author     text         NOT NULL,
  category   text         NOT NULL, -- 'azim' | 'motivasyon' | 'inanc' | 'ekstra' | 'hikmet'
  pool       text         NOT NULL, -- 'explore' | 'home'
  is_active  boolean      NOT NULL DEFAULT true,
  created_at timestamptz  NOT NULL DEFAULT now()
);

-- 2) RLS etkinleştir
ALTER TABLE public.quotes ENABLE ROW LEVEL SECURITY;

-- 3) Herkes okuyabilir (public read)
DROP POLICY IF EXISTS "quotes_public_read" ON public.quotes;
CREATE POLICY "quotes_public_read"
  ON public.quotes
  FOR SELECT
  USING (is_active = true);

-- 4) Sadece admin yazabilir
DROP POLICY IF EXISTS "quotes_admin_write" ON public.quotes;
CREATE POLICY "quotes_admin_write"
  ON public.quotes
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
  );

-- ============================================================
-- 5) SEED DATA — EXPLORE havuzu (storyData.ts'ten)
-- ============================================================

-- AZİM kategorisi (20 söz)
INSERT INTO public.quotes (text, author, category, pool) VALUES
  ('Düşsen de kalk. Her yeniden kalkış, bir zafer başlangıcıdır.', 'FikirForum', 'azim', 'explore'),
  ('Zorluklar, başarının değerini artıran süslerdir.', 'Mimar Sinan', 'azim', 'explore'),
  ('Sabır ağacının meyvesi tatlıdır.', 'Türk Atasözü', 'azim', 'explore'),
  ('Büyük işler, büyük azimle başlar.', 'Hz. Ali', 'azim', 'explore'),
  ('Vazgeçme. Henüz zamanın var.', 'FikirForum', 'azim', 'explore'),
  ('Damlaya damlaya göl olur; adıma adıma dağ aşılır.', 'Türk Atasözü', 'azim', 'explore'),
  ('Zor günler seni kırmak için değil, şekillendirmek için gelir.', 'Anonim', 'azim', 'explore'),
  ('Hiçbir engel azimli bir ruhun önünde duramaz.', 'Ömer Seyfettin', 'azim', 'explore'),
  ('Yenilgi yok; ya kazanırsın ya da öğrenirsin.', 'İbn Haldun', 'azim', 'explore'),
  ('Güneş her sabah yeniden doğar; sen de her gün yeniden başlayabilirsin.', 'FikirForum', 'azim', 'explore'),
  ('Bilmek yetmez, uygulamak gerekir. İstemek yetmez, yapmak gerekir.', 'Goethe', 'azim', 'explore'),
  ('Başarı, cesareti hiç bitmeyen insanın yoludur.', 'Churchill', 'azim', 'explore'),
  ('Adım atmadan yol bitmez.', 'Mevlânâ', 'azim', 'explore'),
  ('Sabır; acıyı taşıma gücü değil, gecenin bitip gündüzün geleceğini bilme erdemidir.', 'Anonim', 'azim', 'explore'),
  ('Her dağın ardında bir vadi vardır; yürümeye devam et.', 'FikirForum', 'azim', 'explore'),
  ('Bugün başlamak, yarın başlamaktan daha değerlidir.', 'Konfüçyüs', 'azim', 'explore'),
  ('Yol uzun olsa da her adım hedefe götürür.', 'Şark Atasözü', 'azim', 'explore'),
  ('Gelecek, dünün hazırlığıyla kurulur.', 'FikirForum', 'azim', 'explore'),
  ('Eğer yükselemiyorsan, merdiven inşa et.', 'Anonim', 'azim', 'explore'),
  ('En büyük zafer, pes etmemektir.', 'FikirForum', 'azim', 'explore')
ON CONFLICT DO NOTHING;

-- MOTİVASYON kategorisi (20 söz)
INSERT INTO public.quotes (text, author, category, pool) VALUES
  ('Dün akıllıydım, dünyayı değiştirmek istedim. Bugün bilgeyim, kendimi değiştiriyorum.', 'Mevlânâ', 'motivasyon', 'explore'),
  ('Umut, uyanık insanların rüyasıdır.', 'Aristoteles', 'motivasyon', 'explore'),
  ('Güzel gören güzel düşünür. Güzel düşünen hayatından lezzet alır.', 'Bediüzzaman', 'motivasyon', 'explore'),
  ('Hayat bir fikirforumdır; durmaksızın yürür.', 'Şark Atasözü', 'motivasyon', 'explore'),
  ('Her arayan bulamaz ama bulanlar ancak arayanlardır.', 'Bayezid-i Bistami', 'motivasyon', 'explore'),
  ('Küçük adımlar büyük yolculukları doğurur.', 'Lao Tzu', 'motivasyon', 'explore'),
  ('Karanlığa küfredeceğine, bir mum da sen yak.', 'Konfüçyüs', 'motivasyon', 'explore'),
  ('Başarının sırrı, başlamaktır.', 'Mark Twain', 'motivasyon', 'explore'),
  ('En uzun yolculuk tek bir adımla başlar.', 'Lao Tzu', 'motivasyon', 'explore'),
  ('Rüyaların büyüklüğü kadar yaşa.', 'FikirForum', 'motivasyon', 'explore'),
  ('Zirveye giden yol, hep engebeli olur.', 'Anonim', 'motivasyon', 'explore'),
  ('Hayaller gerçeğin taslağıdır.', 'Ralph Waldo Emerson', 'motivasyon', 'explore'),
  ('Bugün yaptıkların, yarının seni belirler.', 'Anonim', 'motivasyon', 'explore'),
  ('Güçlü olmanın yolu, güçlü görünmekten değil güçlü olmaktan geçer.', 'Hz. Ömer', 'motivasyon', 'explore'),
  ('Her sabah yeni bir sayfa; onu güzelce yaz.', 'FikirForum', 'motivasyon', 'explore'),
  ('İnsan, niyetine göre değer kazanır.', 'Hz. Muhammed (s.a.v.)', 'motivasyon', 'explore'),
  ('Kök ne kadar derinse, ağaç o kadar yüksek büyür.', 'Anonim', 'motivasyon', 'explore'),
  ('Kendini düzeltmekten aciz olan, başkasını düzeltemez.', 'Hz. Ömer', 'motivasyon', 'explore'),
  ('Soru sormayan öğrenemez.', 'Şeyh Edebali', 'motivasyon', 'explore'),
  ('Her gece biter; sabah gelir. Her sıkıntı geçer; güneş açar.', 'Anonim', 'motivasyon', 'explore')
ON CONFLICT DO NOTHING;

-- İNANÇ kategorisi (20 söz)
INSERT INTO public.quotes (text, author, category, pool) VALUES
  ('Allah bir kapı kapatırsa, başka bir kapı açar.', 'Hz. Ali', 'inanc', 'explore'),
  ('Tevekkül, çalışmayı bırakmak değil; sonucu Allah''a bırakmaktır.', 'İmam Gazali', 'inanc', 'explore'),
  ('Sabır ve şükür; kalbin iki kanadıdır.', 'İbn Kayyım', 'inanc', 'explore'),
  ('Kalp temiz olursa, dilden güzel sözler çıkar.', 'Hz. Mevlana', 'inanc', 'explore'),
  ('Bilgiyle dirilenler ölmez.', 'Hz. Ali', 'inanc', 'explore'),
  ('Kendini bilen, Rabbini bilir.', 'Hz. Muhammed (s.a.v.)', 'inanc', 'explore'),
  ('En faydalı bilgi, insanı iyiliğe ve adalete götüren bilgidir.', 'İmam Gazali', 'inanc', 'explore'),
  ('Faydasız ilim, harcanmayan hazine gibidir.', 'Hz. Muhammed (s.a.v.)', 'inanc', 'explore'),
  ('Dua, kalbin Allah''a uzanan eller açık halidir.', 'Anonim', 'inanc', 'explore'),
  ('Güzel ahlak, imandan bir parçadır.', 'Hz. Muhammed (s.a.v.)', 'inanc', 'explore'),
  ('Rıza; en büyük zenginliktir.', 'Hz. Muhammed (s.a.v.)', 'inanc', 'explore'),
  ('Zorlukla birlikte kolaylık da vardır; şüphesiz güçlükle birlikte bir kolaylık vardır.', 'Kur''an-ı Kerim (İnşirah 5-6)', 'inanc', 'explore'),
  ('Şüphesiz Allah sabredenlerle beraberdir.', 'Kur''an-ı Kerim (Bakara 153)', 'inanc', 'explore'),
  ('Gerçek zenginlik, bilgi ve ahlak zenginliğidir.', 'Farabi', 'inanc', 'explore'),
  ('Kalp; Allah''ın evi. Onu temiz tut.', 'Mevlânâ', 'inanc', 'explore'),
  ('Dünya geçicidir, güzel işler kalıcıdır.', 'Hz. Ali', 'inanc', 'explore'),
  ('Her güneş batışında bir şükür, her güneş doğuşunda bir dua.', 'FikirForum', 'inanc', 'explore'),
  ('İman, en güçlü kaledir.', 'Bediüzzaman', 'inanc', 'explore'),
  ('Adalet mülkün temelidir.', 'Hz. Ömer', 'inanc', 'explore'),
  ('Yüce Allah''a güvenen, asla şaşırmaz.', 'FikirForum', 'inanc', 'explore')
ON CONFLICT DO NOTHING;

-- EKSTRA kategorisi (6 söz)
INSERT INTO public.quotes (text, author, category, pool) VALUES
  ('Büyük işler, büyük azimle ve büyük niyetle başlar.', 'Şeyh Edebali', 'ekstra', 'explore'),
  ('Hedefe odaklanırsan, engeller küçülür.', 'Anonim', 'ekstra', 'explore'),
  ('Fırtınalar geçer; güçlü ağaçlar kök salar.', 'Anonim', 'ekstra', 'explore'),
  ('Çalışmak ibadettir; azim ise ibadetin kalbidir.', 'FikirForum', 'ekstra', 'explore'),
  ('Kendin ol; diğer roller zaten dolu.', 'Oscar Wilde', 'ekstra', 'explore'),
  ('Yarın değil, bugün. Sonra değil, şimdi.', 'FikirForum', 'ekstra', 'explore')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 6) SEED DATA — HOME havuzu (homeData.ts'ten)
-- ============================================================

INSERT INTO public.quotes (text, author, category, pool) VALUES
  ('Birlikte yola çıkmak bir başlangıçtır, bir arada kalmak ilerlemedir, birlikte çalışmak ise başarıdır.', 'Henry Ford', 'hikmet', 'home'),
  ('İyilik yap, denize at; balık bilmezse Halik bilir.', 'Anonim', 'hikmet', 'home'),
  ('Gençlik, geleceğin tohumudur; onu sevgi ve bilgiyle sula.', 'FikirForum', 'hikmet', 'home'),
  ('Yol seni nereye götürüyorsa oraya gitme, yol olmayan yerden git ki iz bırak.', 'R.W. Emerson', 'hikmet', 'home'),
  ('En büyük başarı, hiçbir zaman düşmemekte değil, her düştüğünde tekrar ayağa kalkabilmektedir.', 'Konfüçyüs', 'hikmet', 'home'),
  ('Bilgi ışık gibidir; paylaştıkça çoğalır.', 'Mevlana', 'hikmet', 'home'),
  ('Sabır acıdır, ama meyvesi tatlıdır.', 'Sa''dî', 'hikmet', 'home'),
  ('Düşüncelerinde büyük ol, hayallerinde cesur, eylemlerinde kararlı.', 'Thomas J. Watson', 'hikmet', 'home'),
  ('Başkalarına hizmet etmek, yeryüzünde sürdüğünüz kiranın bedelidir.', 'Muhammad Ali', 'hikmet', 'home'),
  ('Küçük adımlar büyük yolculukların başlangıcıdır.', 'Lao Tzu', 'hikmet', 'home'),
  ('İnsanın en güzel yolculuğu kendi içine yaptığı yolculuktur.', 'Rumi', 'hikmet', 'home'),
  ('Dünyanı değiştirmek istiyorsan önce kendini değiştir.', 'Mahatma Gandhi', 'hikmet', 'home'),
  ('Bir ağaç dikmenin en iyi zamanı yirmi yıl önceydi; ikinci en iyi zaman şimdi.', 'Çin Atasözü', 'hikmet', 'home'),
  ('Başarının sırrı; başlamaktır.', 'Mark Twain', 'hikmet', 'home'),
  ('Azimli bir insan için imkânsız diye bir şey yoktur.', 'Aleksander Büyük', 'hikmet', 'home'),
  ('Bilgelik, deneyimden öğrenilen bilgidir.', 'Oscar Wilde', 'hikmet', 'home'),
  ('Yüce hedefler, sıradan insanları olağanüstü kılar.', 'Anonim', 'hikmet', 'home'),
  ('Her zorluk, yeni bir fırsatın kapısını aralar.', 'Albert Einstein', 'hikmet', 'home'),
  ('İnsanlar yapabileceğini düşündükleri şeyi değil, istediklerini başarırlar.', 'Vince Lombardi', 'hikmet', 'home'),
  ('Karanlıkta bir mum yakmak, karanlığa küsmekten iyidir.', 'Konfüçyüs', 'hikmet', 'home'),
  ('Kendinize inandığınızda başkalarını da inandırabilirsiniz.', 'Zig Ziglar', 'hikmet', 'home'),
  ('Öğrenmek bir hazinedir, onu taşıyan her yere gider.', 'Çin Atasözü', 'hikmet', 'home'),
  ('Sevgi vermek, sevgi almaktır.', 'Fyodor Dostoyevski', 'hikmet', 'home'),
  ('Adalet, güçlünün zayıfa merhameti değil, herkesin hakkının korunmasıdır.', 'Platon', 'hikmet', 'home'),
  ('Umut etmek, yaşamaya devam etmektir.', 'Victor Hugo', 'hikmet', 'home'),
  ('İyi bir kitap yüz arkadaşa bedeldir.', 'A.P.J. Abdul Kalam', 'hikmet', 'home'),
  ('Gülümsemek, insanlar arasındaki en kısa mesafedir.', 'Victor Borge', 'hikmet', 'home'),
  ('Birlik güçtür; birlikte hiçbir şey imkânsız değildir.', 'Walton Family', 'hikmet', 'home'),
  ('Dürüstlük, en iyi politikadır.', 'Benjamin Franklin', 'hikmet', 'home')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 7) Performans için index ekle
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_quotes_pool_active ON public.quotes (pool, is_active);
CREATE INDEX IF NOT EXISTS idx_quotes_category ON public.quotes (category);

-- Tamamlandı! Toplam ~105 özlü söz eklendi.
-- quotes tablosunu Supabase Dashboard > Table Editor'den görüntüleyebilirsiniz.
