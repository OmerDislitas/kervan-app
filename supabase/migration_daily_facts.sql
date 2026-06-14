-- =====================================================
-- GÜNLÜK HAP BİLGİLERİ SİSTEMİ
-- Her gün saat 17:00 (TR) otomatik yenileme
-- =====================================================

-- 1. Büyük Bilgi Havuzu Tablosu
-- =====================================================
CREATE TABLE IF NOT EXISTS public.facts_pool (
  id          SERIAL PRIMARY KEY,
  title       TEXT NOT NULL,
  description TEXT NOT NULL,
  category    TEXT NOT NULL,
  image_url   TEXT NOT NULL,
  color       TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Herkes okuyabilir, admin yazabilir
ALTER TABLE public.facts_pool ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "facts_pool_public_read" ON public.facts_pool;
CREATE POLICY "facts_pool_public_read"
  ON public.facts_pool FOR SELECT
  USING (true);

-- 2. Günlük Seçilen Bilgiler Tablosu
-- =====================================================
CREATE TABLE IF NOT EXISTS public.daily_facts (
  id           SERIAL PRIMARY KEY,
  fact_date    DATE NOT NULL UNIQUE,  -- O güne ait tek kayıt
  facts        JSONB NOT NULL,        -- Seçilen bilgilerin JSON dizisi
  generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS: Herkes okuyabilir
ALTER TABLE public.daily_facts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "daily_facts_public_read" ON public.daily_facts;
CREATE POLICY "daily_facts_public_read"
  ON public.daily_facts FOR SELECT
  USING (true);

-- Tablo yetkilerini tanımla (Permission Denied hatasını önler)
GRANT ALL ON TABLE public.daily_facts TO postgres, anon, authenticated, service_role;
GRANT ALL ON TABLE public.facts_pool TO postgres, anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, anon, authenticated, service_role;

-- 3. Bilgi Havuzunu Doldur (50+ bilgi)
-- =====================================================
TRUNCATE TABLE public.facts_pool RESTART IDENTITY;

INSERT INTO public.facts_pool (title, description, category, image_url, color) VALUES
-- Tıp / Biyoloji
('Nöroplastisite Mucizesi',
 'İnsan beyninin deneyimlere bağlı olarak fiziksel yapısını değiştirebilme yeteneğine nöroplastisite denir. Önceleri beynin belirli bir yaştan sonra gelişmeyi durdurduğu sanılırdı. Ancak yeni araştırmalar, yeni bir dil öğrenmenin veya bir enstrüman çalmanın beyinde yeni nöral ağlar oluşturduğunu gösteriyor. Bu özellik sayesinde ileri yaşlarda bile beynimizi genç ve dinamik tutmak, hafızayı güçlendirmek ve yepyeni beceriler edinmek tamamen bizim elimizdedir.',
 'Tıp', 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=400&auto=format&fit=crop', '#FF6B6B'),

('Bağışıklık Sisteminin Hafızası',
 'İnsan bağışıklık sistemi, daha önce karşılaştığı patojenleri onlarca yıl "hatırlayabilir". B lenfositleri ve T lenfositleri, ilk enfeksiyondan sonra "hafıza hücreleri" oluşturur. Bu sayede aynı mikroba ikinci kez maruz kalındığında, vücut çok daha hızlı ve güçlü bir yanıt verir. Aşılama da bu prensibi kullanır: Hafif ya da ölü bir patojen verilerek bağışıklık sistemine pratik yaptırılır.',
 'Tıp', 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=400&auto=format&fit=crop', '#FF6B6B'),

('Uyku ve Beyin Temizliği',
 'Uyku sırasında beyin, "glenfatik sistem" adı verilen bir mekanizma aracılığıyla kendini temizler. Bu sistem, gün boyunca biriken protein atıklarını (Alzheimer ile ilişkili beta-amiloid dahil) beyin omurilik sıvısıyla yıkayarak uzaklaştırır. Araştırmalar, kronik uyku yoksunluğunun bu temizlik sürecini bozduğunu ve uzun vadede nörodejeneratif hastalık riskini artırdığını göstermektedir.',
 'Tıp', 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?q=80&w=400&auto=format&fit=crop', '#FF6B6B'),

-- Teknoloji / Mühendislik
('Geleceğin Enerjisi: Füzyon',
 'Nükleer füzyon, güneşin ve diğer yıldızların enerji üretme yöntemidir. Atom çekirdeklerinin muazzam bir ısı altında birleşerek devasa enerji açığa çıkarması esasına dayanır. Eğer bilim insanları dünyada füzyon reaksiyonlarını güvenli ve sürekli bir şekilde kontrol altına almayı başarırlarsa, insanlık karbon salınımı olmayan, radyoaktif atık bırakmayan ve deniz suyundan elde edilen yakıtla neredeyse sınırsız bir temiz enerji kaynağına kavuşmuş olacak.',
 'Mühendislik', 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=400&auto=format&fit=crop', '#4D96FF'),

('Yapay Zekanın Temeli',
 'Derin öğrenme (Deep Learning), insan beynindeki biyolojik sinir ağlarından ilham alan ve verileri işlemek için çok katmanlı algoritmalar kullanan bir makine öğrenimi yöntemidir. Bugün otonom araçlardan tıbbi teşhis koyan yazılımlara, dil çevirmenlerinden sanat üreten yapay zekalara kadar kullandığımız tüm gelişmiş sistemler, bu devasa sanal nöron ağlarının milyarlarca veriyi saniyeler içinde analiz edip örüntüleri tanıması sayesinde çalışmaktadır.',
 'Teknoloji', 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400&auto=format&fit=crop', '#9B51E0'),

('DNA Veri Depolama',
 'Teknolojinin ulaştığı son noktalardan biri: DNA üzerine veri yazmak! Sadece 1 gram DNA, tam 215 petabayt (yaklaşık 220 milyon gigabayt) veriyi dış etkenlerden korunması halinde binlerce yıl boyunca bozulmadan saklayabilir. Bu, günümüzde dünyadaki tüm internet verisinin sadece bir ayakkabı kutusu büyüklüğündeki DNA havuzuna sığdırılabileceği anlamına geliyor.',
 'Biyoteknoloji', 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=400&auto=format&fit=crop', '#FFD93D'),

('Kuantum Bilgisayarlar',
 'Klasik bilgisayarlar 0 ve 1 bitlerle çalışırken kuantum bilgisayarlar "qubit" kullanır. Süperpozisyon sayesinde bir qubit aynı anda hem 0 hem 1 olabilir. Bu özellik, belirli hesaplamalar için muazzam bir hız avantajı sağlar: Klasik bir bilgisayarın milyonlarca yıl süreceği bir şifre kırma işlemini kuantum bilgisayar dakikalar içinde yapabilir. Bu durum hem siberguvenlik dünyasını hem de ilaç keşif süreçlerini kökten değiştirebilir.',
 'Teknoloji', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop', '#4D96FF'),

-- Felsefe / Matematik
('Zeno Paradoksu',
 'Antik Yunan filozofu Elealı Zeno, hareketin aslında bir yanılsama olduğunu savunmuştur. En meşhur paradoksunda şöyle der: Bir hedefe varmak için önce yolun yarısını gitmelisiniz. Sonra kalan yarısını, sonra onun da yarısını... Bu sonsuza kadar böyle devam edeceği için teknik olarak hedefinize asla tam anlamıyla ulaşamazsınız. Bu düşünce deneyi, asırlar boyunca matematikçileri sonsuzluk ve limit kavramlarını geliştirmeye itmiş, modern kalkülüsün temellerinin atılmasına ilham olmuştur.',
 'Felsefe', 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?q=80&w=400&auto=format&fit=crop', '#6BCB77'),

('Altın Oran (1.618)',
 'Fibonacci dizisiyle doğrudan bağlantılı olan 1.618 (Phi) oranı, insan gözüne en estetik ve kusursuz gelen matematiksel orandır. Papatya yapraklarının diziliminden ayçiçeği çekirdeklerine, deniz kabuklarının spirallerinden galaksilerin şekline kadar doğanın her köşesine kodlanmıştır. Aynı zamanda Mısır Piramitleri''nden Da Vinci''nin Mona Lisa tablosuna ve modern mimariye kadar sayısız eserde güzelliğin anahtarı olarak bilinçli bir şekilde kullanılmıştır.',
 'Sanat', 'https://images.unsplash.com/photo-1546948630-1149ea60dc86?q=80&w=400&auto=format&fit=crop', '#8D6E63'),

('Pi Sayısının Sonsuzluğu',
 'Pi (π) sayısı, bir dairenin çevresinin çapına bölümüdür ve virgülden sonrası sonsuza kadar hiçbir düzenli tekrar olmadan devam eder. Bu muazzam düzensizlik ve sonsuzluk şu anlama gelir: Evrendeki var olan veya var olabilecek tüm kitaplar, doğum tarihiniz, şifreleriniz ve hatta DNA diziliminiz Pi sayısının içinde bir yerlerde kodlanmış olarak mevcuttur.',
 'Matematik', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop', '#E91E63'),

('Stoacılık ve Kontrol',
 'M.Ö. 3. yüzyılda Zeno of Citium tarafından kurulan Stoacılık, mutluluğun dış koşullara değil zihnimizin durumuna bağlı olduğunu öğretir. Stoacılar, yaşamı "kontrolümüzde olan" (düşünceler, tepkiler, değerler) ve "kontrolümüzde olmayan" (hava, başkalarının davranışları, ölüm) şeklinde ikiye ayırır. Odaklanmamız gereken tek yer kendi zihnimizdir. Bu antik felsefe, Marcus Aurelius ve Epiktetos gibi isimlerin elinde güçlü bir yaşam kılavuzuna dönüşmüştür.',
 'Felsefe', 'https://images.unsplash.com/photo-1472850550668-0dc950c0f4f0?q=80&w=400&auto=format&fit=crop', '#6BCB77'),

-- Doğa / Astronomi
('Arıların Matematiksel Dansı',
 'Bal arıları, yeni bir besin kaynağı bulduklarında kovanlarına döner ve diğer arılara yön tarif etmek için petek üzerinde "sekiz" şekline benzer, titrek bir dans yaparlar (Waggle Dance). Bu dansın yapılış açısı Güneş''e olan yönü tam olarak belirtirken, dansın süresi hedefin ne kadar uzakta olduğunu gösterir. Yani arılar, güneşi bir pusula gibi kullanarak tamamen matematiksel ve geometrik bir dille kusursuz bir harita iletişimi kurarlar.',
 'Doğa', 'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=400&auto=format&fit=crop', '#F9A825'),

('Evrenin Genişlemesi',
 '1920''lerde astronom Edwin Hubble, uzak galaksilerden gelen ışığın kırmızıya kaydığını (Redshift) gözlemleyerek şok edici bir gerçeği ortaya çıkardı: Evren statik değildi ve sürekli olarak genişliyordu. Tıpkı şişen bir balonun üzerindeki noktaların birbirinden uzaklaşması gibi, galaksiler de birbirinden büyük bir hızla uzaklaşmaktaydı. Bu devrim niteliğindeki keşif, evrenin bir başlangıcı olduğunu savunan Büyük Patlama (Big Bang) teorisinin en güçlü kanıtı olmuştur.',
 'Astronomi', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&auto=format&fit=crop', '#3F51B5'),

('Kuantum Dolanıklık',
 'Albert Einstein''ın "uzaktan ürkütücü etkileşim" olarak adlandırdığı kuantum dolanıklık, iki veya daha fazla parçacığın birbirine öyle bir bağlanmasıdır ki, aralarında evrenin zıt uçları kadar mesafe olsa bile birindeki değişim anında diğerini etkiler. Bu fenomen, ışık hızından daha hızlı bir bilgi aktarımının imkansız olduğu klasik fiziğe meydan okur ve geleceğin ultra güvenli kuantum internetinin temelini oluşturur.',
 'Kuantum', 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop', '#673AB7'),

('Ağaçların Gizli İnterneti',
 'Ormanlardaki ağaçlar sadece bağımsız canlılar değildir. Toprağın altındaki devasa miselyum (mantar) ağları sayesinde, adeta devasa bir biyolojik internet ile (Wood Wide Web) birbirlerine bağlıdırlar. Bu ağ üzerinden yaşlı ağaçlar genç fidanlara besin gönderir, hastalanan ağaçlar diğerlerini yaklaşan böcek tehlikelerine karşı uyarır ve orman tek bir dev organizma gibi hareket eder.',
 'Biyoloji', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop', '#2E7D32'),

('Işık Hızı ve Zaman',
 'Işık hızı saniyede yaklaşık 300.000 kilometredir ve evrendeki bilinen en yüksek hız sınırıdır. Einstein''ın İzafiyet Teorisi''ne göre, bir cisim ışık hızına yaklaştıkça onun için zaman daha yavaş akmaya başlar. Eğer ışık hızının %99''u bir hızla uzayda 5 yıl seyahat edip dünyaya dönerseniz, sizin için 5 yıl geçmişken dünyadakiler için onlarca yıl geçmiş olacaktır.',
 'Fizik', 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=400&auto=format&fit=crop', '#00BCD4'),

('Okyanusların Sırrı',
 'Gezegenimizin %71''ini kaplayan okyanusların, günümüz itibariyle hala %80''inden fazlası haritalanmamış, gözlemlenmemiş ve keşfedilmeyi beklemektedir. İnanması güç olsa da, Ay''ın ve hatta Mars''ın yüzeyini, kendi gezegenimizdeki okyanus tabanlarından çok daha detaylı bir şekilde biliyoruz. Derin denizler; bilinmeyen devasa deniz canlılarına, dev denizaltı şelalelerine ve belki de henüz tıpta devrim yaratacak yeni moleküllere ev sahipliği yapıyor.',
 'Coğrafya', 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=400&auto=format&fit=crop', '#0288D1'),

-- Mimari / Tarih
('Mimar Sinan''ın Akustiği',
 'Mimar Sinan, inşa ettiği devasa yapılarla sadece mühendislik değil, aynı zamanda mükemmel bir akustik ustası olduğunu da kanıtlamıştır. Özellikle Süleymaniye Camii''nde, imamın sesinin mikrofonsuz bir şekilde her köşeye eşit iletilmesi için ana kubbenin ve köşelerin etrafına ağızları içe dönük 64 adet boş küp yerleştirmiştir. Yüzyıllar önce tasarlanan bu eşsiz yalıtım ve yankı sistemi, günümüz modern mimarisinde bile hayranlık uyandırmaya devam etmektedir.',
 'Mimari', 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop', '#795548'),

('Endülüs Kütüphaneleri',
 'Orta Çağ''da Avrupa büyük bir karanlık çağ yaşarken ve krallar dahi okuma yazma bilmezken, İspanya''daki Endülüs Emevi Devleti bilim ve kültürün altın çağını yaşıyordu. Kurtuba şehrindeki sadece ana kütüphanede 400.000''den fazla el yazması kitap bulunuyordu. Sokakların aydınlatıldığı, hamamların ve hastanelerin ücretsiz hizmet verdiği bu dönem, modern Avrupa medeniyetinin uyanışına öncülük etmiştir.',
 'Tarih', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop', '#5D4037'),

('Kanallar Şehri Venedik',
 'Venedik, 118 küçük adanın üzerine inşa edilmiş, sokakları su yollarıyla örülmüş ve 400''den fazla köprüyle birbirine bağlanmış eşsiz bir şehirdir. Arabaların tamamen yasak olduğu bu tarihi bölgede tüm ulaşım vaporetolar ve meşhud gondollarla sağlanır. Zamanla sular altında kalma tehlikesiyle karşı karşıya olan bu rüya şehir, Rönesans mimarisinin ve sanatın en görkemli örneklerini barındıran devasa bir açık hava müzesi gibidir.',
 'Şehirler', 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=400&auto=format&fit=crop', '#E65100'),

('Mavi Şehir: Semerkant',
 'İpek Yolu''nun kalbinde yer alan Semerkant, İslam dünyasının en önemli bilim, kültür ve sanat merkezlerinden biridir. Özellikle Timur İmparatorluğu döneminde inşa edilen turkuaz renkli ihtişamlı kubbeleri, çinilerle süslü medreseleri ve o dönemin en gelişmiş rasathaneleriyle ünlüdür. "İslam''ın İncisi" olarak bilinen bu masalsı şehir, astronomi ve matematikte dünya tarihine yön veren pek çok efsanevi alim yetiştirmiştir.',
 'İslam Şehirleri', 'https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?q=80&w=400&auto=format&fit=crop', '#006064'),

-- Ek yeni bilgiler (30+)
('Derin Denizin Işıltısı: Biyolüminesans',
 'Dünyadaki deniz canlılarının %76''sı biyolüminesans özelliğine, yani kendi ışığını üretme yeteneğine sahiptir. Bu ışıma, kimyasal bir reaksiyon olan lüsiferase enzimiyle gerçekleşir. Avlanmak, iletişim kurmak veya düşmanları korkutmak için kullanılan bu doğal ışık kaynağı, bilim insanlarının tıbbi görüntüleme ve kanser teşhisinde kullanmak üzere üzerinde çalıştığı muazzam bir ilham kaynağıdır.',
 'Doğa', 'https://images.unsplash.com/photo-1518478003705-6aa2e9c40d04?q=80&w=400&auto=format&fit=crop', '#00BCD4'),

('Depremlerin Sinyalleri',
 'Deprem öncesinde hayvanların tuhaf davranışlar sergilediği yüzyıllardır gözlemlenmiştir. Ahtapotlar ve yılanlar normalden çok farklı hareket eder, köpekler havlar, atlar huzursuzlanır. Bilim insanları, hayvanların P dalgalarını (ilk, daha hafif sismik dalgalar) S dalgalarından (yıkıcı dalgalar) önce hissedebileceğini düşünmektedir. Bu gözlem, biyolojik erken uyarı sistemlerinin geliştirilmesi için araştırmalara konu olmaktadır.',
 'Doğa', 'https://images.unsplash.com/photo-1547683905-f686c993aae5?q=80&w=400&auto=format&fit=crop', '#F9A825'),

('Kalem Kılıçtan Keskindir',
 'Gutenberg''in 1440''ta matbaayı icat etmesinin ardından Avrupa''da kitap üretimi 200 yılda 15 milyondan 200 milyona fırladı. Bu enformasyon patlaması; Protestan Reformu''nun yayılmasını, Bilimsel Devrim''i ve Aydınlanma Çağı''nı doğrudan mümkün kıldı. Tarihçiler Gutenberg''in icadını, insanlık tarihinin kaderini en çok değiştiren tek buluş olarak görmektedir. Tek bir matbaa, binlerce kopyacı rahibin çalışmasından daha hızlıydı.',
 'Tarih', 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?q=80&w=400&auto=format&fit=crop', '#5D4037'),

('Uzayda Sessizlik Neden?',
 'Uzayda ses iletilmez, çünkü ses iletimi için madde (gaz, sıvı veya katı) gereklidir. Uzay neredeyse mükemmel bir vakumdur. Bu yüzden dev güneş patlamaları, süpernova patlamaları ve kara deliklerin çarpışmaları olağanüstü enerjiler serbest bırakmalarına rağmen hiç ses çıkarmaz. Uzay filmlerindeki dev patlama sesleri tamamen kurgu; gerçek uzay mutlak bir sessizlik içindedir.',
 'Astronomi', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400&auto=format&fit=crop', '#3F51B5'),

('Kara Deliklerin Sınırı: Olay Ufku',
 'Kara deliğin etrafındaki "olay ufku", maddenin veya ışığın bir daha geri dönemeyeceği noktadır. Bir cisim olay ufkunu geçtiğinde, gözlemciye göre zaman neredeyse durur; cisim ise sürekli olarak yavaşlıyor gibi görünür ve kademeli olarak solar. Stephen Hawking, 1974''te kara deliklerin aslında çok yavaş da olsa enerji yaydığını (Hawking Radyasyonu) teorik olarak kanıtladı; bu, fizik tarihinin en büyük öngörülerinden biridir.',
 'Astronomi', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&auto=format&fit=crop', '#673AB7'),

('Rönesans''ın Sırrı: Perspektif',
 'Ortaçağ boyunca Avrupa resimleri, derinlik hissi vermezdi; figürler önem sırasına göre büyük ya da küçük çizilirdi. 1415''te Floransalı mimar Filippo Brunelleschi''nin matematiksel perspektifi keşfetmesi, sanatı sonsuza kadar değiştirdi. Artık ressamlar gerçeklik yanılsaması yaratabiliyordu. Bu tekniğin yayılması, Leonardo da Vinci ve Raphael gibi ustaların doğmasının zeminini hazırladı ve Rönesans''ı mümkün kıldı.',
 'Sanat', 'https://images.unsplash.com/photo-1513694203232-719a280e022f?q=80&w=400&auto=format&fit=crop', '#8D6E63'),

('Dünyanın Manyetik Kalkanı',
 'Dünya''nın iç çekirdeği katı demir-nikeldir; dış çekirdeği ise sıvı. Bu sıvı metalin hareketi, gezegenimizi saran devasa bir manyetik alan (magnetosfera) üretir. Bu görünmez kalkan olmasaydı, güneş rüzgarları birkaç milyon yıl içinde atmosferimizi soyar, okyanusları buharlaştırır ve yaşamı imkansız hale getirirdi. Mars''ın magnetosferini kaybetmesinin, onu bugünkü çorak hale getirdiği düşünülmektedir.',
 'Fizik', 'https://images.unsplash.com/photo-1419242902214-272b3f66ee7a?q=80&w=400&auto=format&fit=crop', '#00BCD4'),

('İbn-i Sina ve Modern Tıp',
 'Orta Çağ''ın en büyük bilim insanlarından İbn-i Sina (Avicenna), 18 yaşında iken dönemin en zor metinlerini ezberden biliyordu. Yazdığı "Kanun fi''t-Tıb" (Tıbbın Kanunu) adlı eseri 600 yıl boyunca hem İslam dünyasında hem de Avrupa üniversitelerinde temel tıp ders kitabı olarak okutuldu. Gözlem temelli teşhis, ilaç etkinliğinin test edilmesi ve bulaşıcı hastalıkların karantina yöntemiyle engellenmesi gibi modern tıbbın temellerini 1000 yıl önce attı.',
 'Tarih', 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?q=80&w=400&auto=format&fit=crop', '#795548'),

('Mantarların Gizli İmparatorluğu',
 'Mantarlar ne bitki ne de hayvandır; evrimsel olarak hayvanlara daha yakın olan ayrı bir krallık oluştururlar. Toprak altındaki miselyum ağları, dünyanın en büyük canlı organizması unvanı için yarışır: Oregon''da bulunan bir bal mantarı kolonisinin 8.000 yıldan yaşlı ve 9 km² alana yayıldığı tahmin edilmektedir. Üstelik mantarlar plastik, petrol ve radyoaktif materyalleri parçalayabilen türleriyle çevre temizliğinde devrimci bir potansiyel taşımaktadır.',
 'Biyoloji', 'https://images.unsplash.com/photo-1535254973040-607b474cb50d?q=80&w=400&auto=format&fit=crop', '#2E7D32'),

('Dil ve Düşünce',
 'Dilbilimci Benjamin Lee Whorf''un "dilsel görelilik" hipotezine göre, konuştuğumuz dil dünyayı algılama biçimimizi şekillendirir. Örneğin; mavi ve yeşilin ayrı kelimeleri olmayan dil konuşucuları bu renkleri birbirinden ayırt etmekte zorlanır. Hopi dilinde zaman kavramı batı dillerinden tamamen farklıdır. Bu hipotez, yapay zeka için dil modellerinin önemini de açıklar: Bir dilin kelime hazinesi, o dilde düşünülebileceklerin sınırını belirler.',
 'Felsefe', 'https://images.unsplash.com/photo-1457369804613-52c61a468e7d?q=80&w=400&auto=format&fit=crop', '#6BCB77'),

('Kâbe''nin Mükemmel Hizalanması',
 'Mekke''deki Kâbe, milyonlarca Müslümanın yönünü belirlediği kutsal yapıdır. Modern GPS ölçümleri, Kâbe''nin köşelerinin dört ana yönle (Kuzey-Güney-Doğu-Batı) neredeyse mükemmel biçimde hizalandığını ortaya koymuştur; sapma yalnızca 1-2 derecedir. Bu hizalama, modern ölçüm araçları olmadan, yüzyıllar önceki inşaat ustalığıyla gerçekleştirilmiştir.',
 'İslam Şehirleri', 'https://images.unsplash.com/photo-1542856391-010fb87dcfed?q=80&w=400&auto=format&fit=crop', '#006064'),

('Göçün Matematiği: Kuşların GPS''i',
 'Avrupa''dan Afrika''ya göç eden bazı kuş türleri, 10.000 km''nin üzerinde bir yolculuğu neredeyse hata yapmadan tamamlar. Araştırmalar, kuşların birden fazla pusula sistemi kullandığını göstermektedir: güneşin konumu, yıldız haritaları ve Dünya''nın manyetik alanını hisseden özel protein reseptörleri. Hatta bazı türler uçarken tek gözünü ve beyin yarısını kapatarak gerçek anlamda uçarken uyuyabilmektedir.',
 'Doğa', 'https://images.unsplash.com/photo-1444464666168-49d633b86797?q=80&w=400&auto=format&fit=crop', '#F9A825'),

('Terör Altında Hayatta Kalmak: Stres Hormonu',
 'Stres hormonu olarak bilinen kortizolün kısa süreli artışı son derece faydalıdır: kan şekerini yükseltir, bağışıklığı güçlendirir ve anında enerji sağlar. Bu "kaç ya da savaş" tepkisi atalarımızı yırtıcılardan korudu. Ancak modern hayatın kronik stresi bu sistemi sürekli açık tutar ve bu, kalp hastalığı, obezite ve depresyona zemin hazırlar. Meditasyon ve egzersizin kortizolü düşürdüğü bilimsel olarak kanıtlanmıştır.',
 'Tıp', 'https://images.unsplash.com/photo-1579154204601-01588f351167?q=80&w=400&auto=format&fit=crop', '#FF6B6B'),

('Fotosentezin Mucizesi',
 'Fotosentez, Dünya''daki neredeyse tüm yaşamın enerji kaynağıdır. Bitkiler, su ve karbondioksiti güneş enerjisiyle birleştirerek oksijen ve glikoz üretir. Bugün soluduğumuz oksijenin büyük bölümü yüz milyonlarca yıl önce yaşayan minik deniz algleri tarafından üretilmiş ve atmosfere bırakılmıştır. Bilim insanları, "yapay fotosentez" ile güneş enerjisini yakıta dönüştürmeyi başarırsa, insanlığın enerji krizi çözülebilir.',
 'Biyoloji', 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop', '#2E7D32'),

('Şifrelemede Asal Sayılar',
 'Bankacılık, mesajlaşma uygulamaları ve internetteki güvenli bağlantıların büyük çoğunluğu, çok büyük asal sayıların çarpanlarına ayrılmasının neredeyse imkansız olmasına dayanır. İki büyük asal sayıyı çarpmak saniyeler sürerken, sonuçtaki devasa sayıyı tekrar iki asal çarpanına bölmek günümüz bilgisayarlarıyla trilyonlarca yıl sürebilir. Bu asimetri, modern dijital güvenliğin temelini oluşturur.',
 'Matematik', 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop', '#E91E63'),

('Su''nun Tuhaf Kimyası',
 'Su (H₂O), küçük molekül kütlesine rağmen çok yüksek bir kaynama noktasına sahiptir — bunun sebebi moleküller arasındaki güçlü hidrojen bağlarıdır. En tuhaf özelliklerinden biri de: su donduğunda genişler ve katı formu (buz) sıvı formundan daha hafif olur. Bu yüzden buz suda batmaz ve göl yüzeyleri önce donar; altındaki su sıvı kalır, balıklar hayatta kalabilir. Bu olmasaydı, okyanuslar dipten donar ve yaşam büyük olasılıkla gelişemezdi.',
 'Kimya', 'https://images.unsplash.com/photo-1559827260-dc66d52bef19?q=80&w=400&auto=format&fit=crop', '#00BCD4'),

('Satrancın Kombinasyon Sayısı',
 'Bir satranç oyununda yapılabilecek olası hamle sayısı, gözlemlenebilir evrende atom sayısından (10⁸⁰) çok daha fazladır. Bu sayı Shannon sayısı olarak bilinir: yaklaşık 10¹²⁰. Bu yüzden satranç bilgisayarları her olası hamleyi hesaplamaz; bunun yerine sezgisel algoritmalar ve derinlik-öncelikli arama kullanır. Deep Blue''nun 1997''de Kasparov''u yenişi, makine zekasının sembolik bir dönüm noktası olmuştur.',
 'Teknoloji', 'https://images.unsplash.com/photo-1528819622765-d6bcf132f793?q=80&w=400&auto=format&fit=crop', '#9B51E0'),

('Tuz Yolları: Tarihin İlk Küreselleşmesi',
 'Tuzu taşıyan ticaret yolları, antik dünyanın en önemli ekonomik dinamiklerinden biriydi. Latince''de "maaş" anlamına gelen "salary" kelimesi, Roma askerlerinin zaman zaman tuz ile ödenmesinden gelmektedir. Tuz; et ve balığı konserve etmek, tabaklama yapmak ve ayinlerde kullanmak için vazgeçilmezdi. Venedik, Kuzey Afrika ve Çin''de tuz tekelleri imparatorlukların gücünü şekillendirdi.',
 'Tarih', 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?q=80&w=400&auto=format&fit=crop', '#5D4037'),

('Renkler Gerçek mi?',
 'Renkler, fiziksel dünyanın bir özelliği değil; beynin elektromanyetik dalgaları yorumlamasının bir ürünüdür. Işığın dalga boyları vardır; "kırmızı" veya "mavi" yoktur — bunlar beynimizin 430-700 nanometre aralığındaki dalgalara verdiği isimlerdir. Renk körlüğü olan kişiler aynı dalgaları farklı yorumlar; bazı hayvanlar (örümcek ve arı) ise insanların göremediği ultraviyole ışığı görebilir. Yani her varlık, farklı bir evren "görüyor".',
 'Felsefe', 'https://images.unsplash.com/photo-1568444810234-2e27ef6fa6e3?q=80&w=400&auto=format&fit=crop', '#6BCB77'),

('Gökyüzündeki Köprüler: Kuantum Tünelleme',
 'Klasik fizikte, bir top bir tepeyi aşmak için yeterince enerjiye sahip olmalıdır. Kuantum dünyasında ise parçacıklar, teorik olarak aşamayacakları enerji bariyerlerini "tüneleyerek" geçebilirler. Bu fenomen; güneşin yanmasını (füzyonu), DNA mutasyonlarını ve modern transistörlerin çalışmasını mümkün kılar. Biyologlara göre bazı enzim reaksiyonları da kuantum tünellemeden yararlanmaktadır — yani yaşam, kuantum bir temelüzerinde yükselmektedir.',
 'Fizik', 'https://images.unsplash.com/photo-1462331940025-496dfbfc7564?q=80&w=400&auto=format&fit=crop', '#3F51B5'),

('İstanbul''un Altında: Binlerce Yıllık Katmanlar',
 'İstanbul, en az 8.500 yıldır kesintisiz olarak yerleşim yeri olan dünyanın nadir şehirlerinden biridir. Her metro veya inşaat kazısı, yeni tarihi katmanlar ortaya çıkarır: Marmaray projesi sırasında 8. yüzyıldan kalma Theodosios Limanı, 35 antik gemi enkazı ve binlerce tarihi eser gün yüzüne çıktı. Şehrin altı; Bizans saraylarından Roma arenalarına, Osmanlı su sarnıçlarından Erken Tunç Çağı yerleşimlerine uzanan devasa bir zaman kapsülüdür.',
 'Şehirler', 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=400&auto=format&fit=crop', '#E65100'),

('Akdeniz''in Kuruması',
 'Yaklaşık 5.5 milyon yıl önce Messinyen Tuzluluk Krizi sırasında, Akdeniz''i Atlantik''e bağlayan boğaz kapandı ve deniz tamamen buharlaşarak dev bir tuz çölüne dönüştü. Bu olay yaklaşık 700.000 yıl sürdü. Sonunda Gibraltar Boğazı''nı açan dev bir kırılma yaşandı ve bugün Niagara Şelalesi''nin 1000 katı bir debiye sahip olduğu düşünülen muhteşem bir sel, Akdeniz havzasını binlerce yılda yeniden doldurdu.',
 'Coğrafya', 'https://images.unsplash.com/photo-1516825295-a2ed1c823a2e?q=80&w=400&auto=format&fit=crop', '#0288D1'),

('Büyük Hadron Çarpıştırıcısı',
 'CERN''deki Büyük Hadron Çarpıştırıcısı (LHC), insanlığın inşa ettiği en büyük ve en karmaşık makinedir. İsviçre-Fransa sınırı boyunca 27 km''lik bir döngü içinde protonları ışık hızının %99.9999999''una hızlandırıp çarpıştırır. Çarpışmalar, Büyük Patlama''dan hemen sonraki koşulları taklit eder ve 2012''de Higgs Bozonu''nun keşfini mümkün kıldı. Bu parçacık, maddeye kütle kazandıran mekanizmanın kanıtıdır.',
 'Fizik', 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&auto=format&fit=crop', '#3F51B5'),

('Mikrobiyom: İçimizdeki Evren',
 'İnsan vücudunda, insan hücrelerinden daha fazla bakteri, virüs, mantar ve mikrop yaşar. Bu mikroorganizma topluluğu (mikrobiyom) özellikle bağırsakta yoğunlaşır ve yaklaşık 1.5 kg ağırlığa ulaşır. Araştırmalar, bağırsak mikrobiyomunun ruh halimizi, bağışıklığımızı, kilomuz ve hatta düşünce kalıplarımızı etkilediğini ortaya koymaktadır. Bağırsak-beyin ekseni üzerinden doğrudan bir iletişim hattı vardır; bu yüzden bağırsak "ikinci beyin" olarak da anılır.',
 'Biyoloji', 'https://images.unsplash.com/photo-1576086213369-97a306d36557?q=80&w=400&auto=format&fit=crop', '#2E7D32'),

('Dilber-i Dünya: Şems-i Tebrizi',
 'Mevlana Celaleddin Rumi, 37 yaşında karşılaştığı gezgin derviş Şems-i Tebrizi ile tanışana kadar ilahiyat profesörü ve geleneksel bir alimdi. Şems''le geçirdiği yoğun ruhanî sohbetler onu kökten dönüştürdü. Şems''in 1247''de ortadan kaybolması Rumi''yi derinden sarstı; ancak bu keder, içinden Mesnevi, Divan-ı Kebir gibi dünya edebiyatının başyapıtlarını doğurdu. Acı, en güçlü dönüştürücü güçtür.',
 'Tarih', 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop', '#5D4037');

-- 4. Günlük Bilgi Seçim Fonksiyonu
-- =====================================================
CREATE OR REPLACE FUNCTION public.generate_daily_facts()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  today_date DATE := CURRENT_DATE;
  day_seed   INT  := EXTRACT(DOY FROM today_date)::INT +
                     EXTRACT(YEAR FROM today_date)::INT * 1000;
  selected   JSONB;
BEGIN
  -- Eğer bugün için zaten kayıt varsa üzerine yaz (güncelle)
  DELETE FROM public.daily_facts WHERE fact_date = today_date;

  -- Havuzdan deterministik ama görünürde rastgele 17 bilgi seç
  -- (seed: yılın günü + yıl * 1000 → her yıl farklı sıralama)
  SELECT jsonb_agg(row_to_json(f.*))
  INTO selected
  FROM (
    SELECT
      id,
      title,
      description AS desc,
      category,
      image_url   AS image,
      color
    FROM public.facts_pool
    ORDER BY (id * day_seed) % (SELECT COUNT(*)::INT FROM public.facts_pool)
    LIMIT 17
  ) f;

  INSERT INTO public.daily_facts (fact_date, facts, generated_at)
  VALUES (today_date, selected, NOW());

  RAISE NOTICE 'Günlük bilgiler oluşturuldu: % (%)', today_date, jsonb_array_length(selected);
END;
$$;

-- 5. Bugün için hemen çalıştır (ilk kurulum)
-- =====================================================
SELECT public.generate_daily_facts();

-- 6. pg_cron ile her gün 17:00 TR saatinde otomatik çalıştır
-- =====================================================
-- ÖNCE: Supabase Dashboard → Extensions → pg_cron'u aktive et
-- Sonra aşağıdaki satırı çalıştır:

DO $$
BEGIN
  -- pg_cron yüklüyse zamanla
  IF EXISTS (
    SELECT 1 FROM pg_extension WHERE extname = 'pg_cron'
  ) THEN
    -- Var olan job varsa önce sil
    PERFORM cron.unschedule('generate-daily-facts')
    WHERE EXISTS (
      SELECT 1 FROM cron.job WHERE jobname = 'generate-daily-facts'
    );

    PERFORM cron.schedule(
      'generate-daily-facts',
      '0 14 * * *',  -- UTC 14:00 = Türkiye 17:00 (UTC+3)
      'SELECT public.generate_daily_facts()'
    );
    RAISE NOTICE 'pg_cron job kuruldu: Her gün 14:00 UTC (17:00 TR)';
  ELSE
    RAISE NOTICE 'pg_cron aktif değil. Supabase Dashboard > Extensions > pg_cron aktive edin, sonra bu SQL''i tekrar çalıştırın.';
  END IF;
END;
$$;
