-- ============================================================
-- Etkinlik Önerileri Sistemi (v7)
-- ============================================================

-- 1) Öneriler Tablosu
CREATE TABLE IF NOT EXISTS public.event_suggestions (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title text NOT NULL,
    description text,
    suggested_date text,
    location text,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'approved', 'rejected')),
    created_at timestamptz DEFAULT now()
);

-- 2) RLS Ayarları
ALTER TABLE public.event_suggestions ENABLE ROW LEVEL SECURITY;

-- Kullanıcılar kendi önerilerini görebilir
CREATE POLICY "Users can view own suggestions" 
ON public.event_suggestions FOR SELECT 
USING (auth.uid() = user_id);

-- Kullanıcılar öneri oluşturabilir
CREATE POLICY "Users can insert suggestions" 
ON public.event_suggestions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Adminler tüm önerileri görebilir
CREATE POLICY "Admins can view all suggestions" 
ON public.event_suggestions FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- Adminler önerileri güncelleyebilir (durum değişikliği için)
CREATE POLICY "Admins can update suggestions" 
ON public.event_suggestions FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 3) Gerçek zamanlı dinleme (isteğe bağlı)
ALTER PUBLICATION supabase_realtime ADD TABLE public.event_suggestions;
