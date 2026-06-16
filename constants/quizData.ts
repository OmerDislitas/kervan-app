// Quiz soruları — explore/index.tsx'ten constants'a taşındı
// ~100 soruluk havuz; dayOfYear % length ile her gün farklı soru seçilir

export interface QuizQuestion {
  q: string;
  options: string[];
  correct: number;
  explanation: string;
}

export const QUIZ_POOL: QuizQuestion[] = [
  // --- OSMANLI & TÜRK TARİHİ ---
  { q: 'İstanbul hangi yılda fethedildi?', options: ['1389', '1453', '1526', '1683'], correct: 1, explanation: 'Fatih Sultan Mehmet, İstanbul\'u 29 Mayıs 1453\'te fethetti. Bu tarih Ortaçağ\'ın sonu ve Yeniçağ\'ın başlangıcı olarak kabul edilir.' },
  { q: 'Osmanlı Devleti\'nin kurucusu kimdir?', options: ['Orhan Gazi', 'Osman Gazi', 'Murat I', 'Yıldırım Bayezid'], correct: 1, explanation: 'Osmanlı Devleti\'ni Osman Gazi kurmuştur. 1299 yılında bağımsızlığını ilan eden devlet 1922\'ye kadar sürdü.' },
  { q: 'Malazgirt Savaşı hangi yılda yapıldı?', options: ['1048', '1071', '1096', '1176'], correct: 1, explanation: 'Malazgirt Savaşı 26 Ağustos 1071\'de Sultan Alparslan ile Bizans İmparatoru Romanos arasında yapıldı. Bu zafer Anadolu\'nun Türklere kapısını açtı.' },
  { q: 'Çanakkale Zaferi hangi yılda kazanıldı?', options: ['1912', '1915', '1919', '1922'], correct: 1, explanation: 'Çanakkale Deniz Zaferi 18 Mart 1915\'te kazanıldı. Bu tarih her yıl "Çanakkale Zaferi ve Şehitler Günü" olarak anılır.' },
  { q: 'Osmanlı\'nın ilk başkenti neresidir?', options: ['Bursa', 'Edirne', 'İstanbul', 'Söğüt'], correct: 0, explanation: 'Bursa, 1326\'da Orhan Gazi tarafından fethedilerek Osmanlı\'nın ilk büyük başkenti oldu. Daha önce geçici başkent Söğüt\'tü.' },
  { q: 'Selçuklu Devleti\'ni kim kurdu?', options: ['Tuğrul Bey', 'Alparslan', 'Sencer', 'Melikşah'], correct: 0, explanation: 'Büyük Selçuklu Devleti, Tuğrul Bey tarafından 1037\'de kuruldu. 1055\'te Bağdat\'a girerek Abbasi halifesini himayesine aldı.' },
  { q: 'Mimar Sinan\'ın kendi şaheseri olarak gösterdiği eser hangisidir?', options: ['Süleymaniye Camii', 'Selimiye Camii', 'Şehzade Camii', 'Sultanahmet Camii'], correct: 1, explanation: 'Mimar Sinan, Edirne\'deki Selimiye Camii\'ni kendi ustalık eseri olarak belirtmiştir. Süleymaniye Camii ise çıraklık eseridir.' },
  { q: 'Türkiye Cumhuriyeti hangi yılda ilan edildi?', options: ['1920', '1921', '1922', '1923'], correct: 3, explanation: 'Türkiye Cumhuriyeti 29 Ekim 1923\'te ilan edildi. Mustafa Kemal Atatürk ilk cumhurbaşkanı oldu.' },
  { q: 'Osmanlı\'da divan şiirinin en büyük şairi kimdir?', options: ['Fuzuli', 'Baki', 'Nedim', 'Şeyh Galip'], correct: 0, explanation: 'Fuzuli (1483-1556), hem Türkçe hem Arapça hem de Farsça divan şiiriyle tanınan Osmanlı\'nın en büyük lirik şairlerinden biridir.' },
  { q: 'Viyana Kuşatması kaç kez yapılmıştır?', options: ['1', '2', '3', '4'], correct: 1, explanation: 'Osmanlılar Viyana\'yı iki kez kuşattı: 1529\'da Kanuni Sultan Süleyman döneminde ve 1683\'te IV. Mehmed döneminde. Her ikisinde de şehir alınamadı.' },
  { q: 'Atatürk\'ün soyadı hangi yılda verildi?', options: ['1932', '1934', '1936', '1938'], correct: 1, explanation: '1934\'te çıkarılan Soyadı Kanunu ile Türk Büyük Millet Meclisi, Mustafa Kemal\'e "Atatürk" soyadını verdi.' },
  { q: 'Kurtuluş Savaşı hangi antlaşmayla sona erdi?', options: ['Sevr', 'Mondros', 'Lozan', 'Mudanya'], correct: 2, explanation: 'Kurtuluş Savaşı, 24 Temmuz 1923\'te imzalanan Lozan Antlaşması ile sona erdi ve Türkiye\'nin bağımsızlığı uluslararası alanda tanındı.' },

  // --- İSLAM & KUR'AN BİLGİSİ ---
  { q: 'Kur\'an-ı Kerim kaç sureden oluşur?', options: ['99', '110', '114', '120'], correct: 2, explanation: 'Kur\'an-ı Kerim 114 sureden ve 6236 ayetten oluşmaktadır. En uzun sure Bakara, en kısa sure Kevser suresidir.' },
  { q: 'Hz. Muhammed (s.a.v.) hangi şehirde doğdu?', options: ['Medine', 'Kudüs', 'Mekke', 'Taif'], correct: 2, explanation: 'Hz. Muhammed (s.a.v.) 571 yılında Mekke\'de doğdu. Bu yıl "Fil Yılı" olarak da bilinir.' },
  { q: 'Hicret hangi yılda gerçekleşti?', options: ['610', '615', '622', '632'], correct: 2, explanation: 'Hz. Muhammed (s.a.v.) ve ashabı 622 yılında Mekke\'den Medine\'ye hicret etti. İslam takvimi bu olaydan başlatılır.' },
  { q: 'İslam\'ın şartları kaçtır?', options: ['3', '4', '5', '6'], correct: 2, explanation: 'İslam\'ın beş şartı: Kelime-i Şehadet, Namaz, Oruç, Zekât ve Hac\'dır. Bu beş temel ibadet "Erkan-ı İslam" olarak adlandırılır.' },
  { q: 'Kadir Gecesi Ramazan\'ın kaçıncı gecesidir?', options: ['15. gece', '21. gece', '27. gece', '29. gece'], correct: 2, explanation: 'Kadir Gecesi, Ramazan\'ın 27. gecesi olarak yaygın şekilde kabul edilir. Kur\'an bu geceyi "bin aydan hayırlı" olarak nitelendirir.' },
  { q: 'Ramazan kaç gün sürer?', options: ['28', '29 veya 30', '31', '33'], correct: 1, explanation: 'Ramazan ayı, hicri takvimde 29 veya 30 gün sürer. Hilalin görülmesine göre bu süre belirlenir.' },
  { q: 'Mescid-i Haram hangi şehirdedir?', options: ['Medine', 'Kudüs', 'Mekke', 'Taif'], correct: 2, explanation: 'Mescid-i Haram, Mekke\'de bulunmakta ve içinde Kâbe\'yi barındırmaktadır. Müslümanların kıblegahı olan bu mescit dünyanın en büyük camisidir.' },
  { q: 'Hz. İbrahim\'in doğduğu yer neresidir?', options: ['Mekke', 'Kudüs', 'Ur (Irak)', 'Medine'], correct: 2, explanation: 'Hz. İbrahim, günümüz Irak sınırları içindeki Ur şehrinde doğmuştur. Nemrud\'un zulmünden kaçarak Harran\'a, oradan da Filistin\'e göç etmiştir.' },
  { q: 'İslam\'da namaz kaç vakit farzdır?', options: ['3', '4', '5', '6'], correct: 2, explanation: 'Günde beş vakit namaz: Sabah, Öğle, İkindi, Akşam ve Yatsı. Bu farzı Miraç gecesinde Hz. Peygamber almıştır.' },
  { q: 'Kur\'an-ı Kerim\'in en uzun suresi hangisidir?', options: ['Al-i İmran', 'Bakara', 'Nisa', 'Maide'], correct: 1, explanation: 'Bakara Suresi, 286 ayetle Kur\'an\'ın en uzun suresidir. "Baqara" Arapçada inek demektir ve bu adını içindeki inek kıssasından alır.' },
  { q: 'Dört Büyük Halifenin ilki kimdir?', options: ['Hz. Ömer', 'Hz. Osman', 'Hz. Ebubekir', 'Hz. Ali'], correct: 2, explanation: 'Hz. Ebubekir, Hz. Muhammed\'in vefatının ardından İslam\'ın ilk halifesi seçildi. Hilafeti 632-634 yılları arasında sürdü.' },
  { q: 'İslam\'da farz orucu hangi ay tutulur?', options: ['Muharrem', 'Recep', 'Şaban', 'Ramazan'], correct: 3, explanation: 'Ramazan ayında oruç tutmak İslam\'ın beş şartından biridir. Hicri takvimin dokuzuncu ayında tutulur.' },
  { q: 'Hz. Peygamber\'e ilk vahiy nerede geldi?', options: ['Mescid-i Haram\'da', 'Hira Mağarası\'nda', 'Medine\'de', 'Taif\'te'], correct: 1, explanation: 'İlk vahiy Hira Mağarası\'nda geldi. Hz. Peygamber orada tefekkür ederken Cebrail ona "Oku!" diyerek Alak Suresi\'nin ilk ayetlerini getirdi.' },
  { q: 'Kıble önce nereye doğruydu?', options: ['Mekke\'ye', 'Medine\'ye', 'Kudüs\'e', 'Taif\'e'], correct: 2, explanation: 'İlk kıble Kudüs\'teydi (Mescid-i Aksa). Hicretin 2. yılında kıble, Allah\'ın emriyle Mekke\'deki Kâbe\'ye döndürüldü.' },
  { q: 'İslam\'da abdest kaç farzdan oluşur?', options: ['3', '4', '6', '7'], correct: 1, explanation: 'Abdestin dört farzı: Yüzü yıkamak, elleri dirseklerle birlikte yıkamak, başın dörtte birini meshetmek ve ayakları topuklarla birlikte yıkamak.' },

  // --- İSLAM ALİMLERİ & MUTASAVVIFLAR ---
  { q: 'İmam Gazali\'nin en meşhur eseri hangisidir?', options: ['Mesnevi', 'İhya-u Ulumiddin', 'Fususül-Hikem', 'Mukaddime'], correct: 1, explanation: 'İhya-u Ulumiddin (Din İlimlerinin Yeniden Canlandırılması), İmam Gazali\'nin en önemli eseridir. Asırlardır okunmaya devam etmektedir.' },
  { q: 'Hz. Mevlana\'nın eseri Mesnevi kaç ciltten oluşur?', options: ['3', '5', '6', '7'], correct: 2, explanation: 'Mevlana Celaleddin-i Rumi\'nin Mesnevi\'si 6 ciltten ve yaklaşık 25.000 beyitten oluşmaktadır. Farsça yazılmıştır.' },
  { q: 'İbn-i Battuta hangi ülkelidir?', options: ['Mısırlı', 'Faslı', 'İranlı', 'Türk'], correct: 1, explanation: 'İbn-i Battuta (1304-1368), Fas\'ın Tanca şehrinde doğmuş büyük İslam seyyahıdır. 29 yılda 120.000 km\'yi aşkın mesafe kat etti.' },
  { q: 'İbn-i Sina hangi alanda öncüdür?', options: ['Matematik', 'Tıp & Felsefe', 'Astronomi', 'Kimya'], correct: 1, explanation: 'İbn-i Sina (980-1037), "Tıbbın Kanunu" adlı eseriyle hem İslam dünyasına hem de Avrupa\'ya yüzyıllarca rehberlik etmiştir.' },
  { q: 'Farabi\'nin lakabı nedir?', options: ['Üstad-ı Evvel', 'Muallim-i Sani', 'Hüccetü\'l-İslam', 'Şeyhu\'r-Reis'], correct: 1, explanation: 'Farabi "Muallim-i Sani" (İkinci Öğretmen) lakabıyla anılır. Birinci öğretmen ise Aristoteles\'tir. Mantık ve müzik alanlarında devrimci çalışmalar yapmıştır.' },
  { q: 'Bediüzzaman Said Nursi\'nin temel eseri hangisidir?', options: ['Risale-i Nur', 'Mesnevi', 'Fütuhat', 'İhya'], correct: 0, explanation: 'Bediüzzaman Said Nursi\'nin Risale-i Nur Külliyatı, modern çağda İslam\'ın imani meselelerini akli delillerle ele alan temel bir eserdir.' },
  { q: 'İmam-ı Azam Ebu Hanife\'nin kurduğu mezhep hangisidir?', options: ['Maliki', 'Şafii', 'Hanbeli', 'Hanefi'], correct: 3, explanation: 'Ebu Hanife\'nin kurduğu Hanefi mezhebi, Türkiye dahil pek çok ülkede en yaygın fıkıh mezhebidir. Ebu Hanife 699-767 yılları arasında yaşadı.' },
  { q: 'Hallac-ı Mansur "Enel Hak" derken ne kastetmiştir?', options: ['Ben Allah\'ım', 'Bende Hak tecelli etti', 'Ben haklıyım', 'Sadece şiir söyledi'], correct: 1, explanation: 'Hallac-ı Mansur\'un "Enel Hak" (Ben Hak\'ım) sözü vahdet-i vücud anlayışında ilahi aşkın zirvesini ifade eder; "Allah bende tecelli etti" anlamındadır.' },

  // --- PEYGAMBERLER ---
  { q: 'Hz. Nuh\'un gemisi hangi dağa oturdu?', options: ['Ağrı Dağı', 'Cudi Dağı', 'Sinai Dağı', 'Zeytin Dağı'], correct: 1, explanation: 'Kur\'an\'a göre Hz. Nuh\'un gemisi Cudi Dağı\'na oturmuştur. Bu dağ günümüzde Türkiye\'nin Şırnak ilinde yer almaktadır.' },
  { q: 'Kur\'an\'da adı en çok geçen peygamber kimdir?', options: ['Hz. Muhammed', 'Hz. İsa', 'Hz. Musa', 'Hz. İbrahim'], correct: 2, explanation: 'Hz. Musa\'nın adı Kur\'an\'da 136 kez geçmektedir. Hz. Muhammed\'in adı ise 4 kez doğrudan geçer.' },
  { q: 'Hz. Yusuf hangi ülkede kral olmuştur?', options: ['Arabistan', 'Irak', 'Mısır', 'Filistin'], correct: 2, explanation: 'Hz. Yusuf, kardeşleri tarafından kuyuya atıldıktan sonra Mısır\'a götürülmüş ve orada Firavun\'un yanında yönetici konumuna yükselmiştir.' },
  { q: 'Hz. İsa\'nın annesi kimdir?', options: ['Hz. Meryem', 'Hz. Hacer', 'Hz. Asiye', 'Hz. Fatıma'], correct: 0, explanation: 'Hz. İsa, Kur\'an\'da "İsa bin Meryem" olarak adlandırılır. Annesi Hz. Meryem\'dir. Kur\'an\'da Meryem adına ayrı bir sure bulunmaktadır.' },
  { q: 'Kur\'an\'da adı geçen tek kadın kimdir?', options: ['Hz. Fatıma', 'Hz. Hatice', 'Hz. Meryem', 'Hz. Aişe'], correct: 2, explanation: 'Hz. Meryem, Kur\'an\'da adı doğrudan geçen tek kadındır. Kur\'an\'da ona ayrılan "Meryem" suresi 19. suredir.' },

  // --- TÜRK KÜLTÜRÜ & COĞRAFYASİ ---
  { q: 'Türkiye\'nin başkenti neresidir?', options: ['İstanbul', 'İzmir', 'Bursa', 'Ankara'], correct: 3, explanation: 'Ankara, 13 Ekim 1923\'te Türkiye Cumhuriyeti\'nin başkenti ilan edildi.' },
  { q: 'Türk alfabesi kaç harften oluşur?', options: ['26', '28', '29', '33'], correct: 2, explanation: 'Türk alfabesi 29 harften oluşmaktadır. 1928 yılında harf inkılabıyla Latin alfabesine geçildi.' },
  { q: 'Türkiye\'nin en uzun nehri hangisidir?', options: ['Dicle', 'Fırat', 'Kızılırmak', 'Yeşilırmak'], correct: 2, explanation: 'Kızılırmak, 1355 km ile Türkiye\'nin en uzun nehridir. Anadolu\'nun ortasından kıvrılarak Karadeniz\'e dökülür.' },
  { q: 'Türk kahvesi UNESCO tarafından ne zaman kültürel miras ilan edildi?', options: ['2008', '2013', '2015', '2019'], correct: 1, explanation: 'Türk kahvesi kültürü ve geleneği, 2013 yılında UNESCO İnsanlığın Somut Olmayan Kültürel Mirası Listesi\'ne alındı.' },
  { q: 'Göktürk Kağanlığı ne zaman kuruldu?', options: ['552', '630', '744', '840'], correct: 0, explanation: 'Birinci Göktürk Kağanlığı 552 yılında Bumin Kağan tarafından kuruldu. Türklerin ilk büyük devletlerinden biri olarak tarihte önemli bir yer tutar.' },

  // --- BİLİM & TEKNOLOJİ ---
  { q: 'Dünyanın güneş etrafında dönme süresi kaç gündür?', options: ['354', '360', '365.25', '370'], correct: 2, explanation: 'Dünya, güneş etrafındaki tam bir turunu yaklaşık 365.25 günde tamamlar. Bu nedenle her 4 yılda bir "artık yıl" eklenir.' },
  { q: 'Su molekülünün kimyasal formülü nedir?', options: ['HO', 'H2O', 'H2O2', 'HO2'], correct: 1, explanation: 'Su, iki hidrojen ve bir oksijen atomundan oluşur: H₂O. Hayatın temel maddesidir ve Dünya\'nın yüzeyinin %71\'ini kaplar.' },
  { q: 'İnsan vücudunda kaç kemik bulunur?', options: ['176', '206', '248', '300'], correct: 1, explanation: 'Yetişkin insan iskeleti 206 kemikten oluşur. Bebeklerde bu sayı 270-300 civarındayken yaşla birlikte kemikler birleşerek azalır.' },
  { q: 'Güneş sistemimizin en büyük gezegeni hangisidir?', options: ['Satürn', 'Neptün', 'Jüpiter', 'Uranüs'], correct: 2, explanation: 'Jüpiter, güneş sisteminin en büyük gezegenidir. Kütlesi Dünya\'nın 318 katıdır. Büyük Kırmızı Leke adı verilen fırtınasıyla tanınır.' },
  { q: 'Işık hızı yaklaşık kaç km/sn\'dir?', options: ['100.000', '200.000', '300.000', '400.000'], correct: 2, explanation: 'Işık, saniyede yaklaşık 299.792 km yol alır. Bu hız fiziğin temel sabitlerinden biri olup hiçbir madde bu hıza ulaşamaz.' },
  { q: 'DNA\'nın açılımı nedir?', options: ['Deoksiribonükleik Asit', 'Dinükleik Asit', 'Difosforik Asit', 'Diribonükleik Asit'], correct: 0, explanation: 'DNA (Deoksiribonükleik Asit), canlıların genetik bilgisini taşıyan moleküldür. İnsan DNA\'sı yaklaşık 3 milyar baz çiftinden oluşur.' },
  { q: 'Periyodik tabloda kaç element bulunur?', options: ['92', '108', '118', '128'], correct: 2, explanation: 'Güncel periyodik tabloda 118 element bulunmaktadır. Bunların 94\'ü doğada oluşur, geri kalanları laboratuvarda sentezlenmiştir.' },
  { q: 'Newton\'un yer çekimi yasasını keşfetmesine ne ilham verdi?', options: ['Elma düşmesi', 'Ay tutulması', 'Yıldız gözlemi', 'Su dalgaları'], correct: 0, explanation: 'Newton\'un elma ağacının altında otururken düşen bir elmayı görmesi yer çekimi düşüncesine ilham verdiği söylenir. Bu olay Cambridge\'de yaşandı.' },

  // --- DÜNYA TARİHİ ---
  { q: 'Büyük İskender hangi ülkeden çıkmıştır?', options: ['Yunanistan', 'Makedonya', 'Roma', 'Pers'], correct: 1, explanation: 'Büyük İskender (M.Ö. 356-323), Makedonya Krallığı\'ndan çıkmış ve Anadolu\'dan Hindistan\'a kadar geniş bir coğrafyayı fetheden büyük komutandır.' },
  { q: 'Fransız Devrimi hangi yılda başladı?', options: ['1776', '1789', '1799', '1815'], correct: 1, explanation: 'Fransız Devrimi 1789\'da Bastille Hapishanesi\'nin basılmasıyla sembolik olarak başladı. "Özgürlük, Eşitlik, Kardeşlik" sloganı dünyayı değiştirdi.' },
  { q: 'Çin Seddi hangi amaçla inşa edilmiştir?', options: ['Kanallar için', 'Yollar için', 'Kuzeyden gelen saldırılara karşı', 'Sınır belirtmek için'], correct: 2, explanation: 'Çin Seddi, başta Moğol ve Türk akınları olmak üzere kuzeyden gelen saldırıları önlemek amacıyla M.Ö. 7. yüzyıldan itibaren inşa edilmiştir.' },
  { q: 'Mona Lisa\'yı kim yazmıştır?', options: ['Michelangelo', 'Rafael', 'Leonardo da Vinci', 'Botticelli'], correct: 2, explanation: 'Mona Lisa, Leonardo da Vinci tarafından 1503-1519 yılları arasında yapılmıştır. Şu anda Paris\'teki Louvre Müzesi\'nde sergilenmektedir.' },
  { q: 'İlk Olimpiyat Oyunları nerede düzenlendi?', options: ['Roma', 'Atina', 'Sparta', 'Olimpia'], correct: 3, explanation: 'İlk antik Olimpiyat Oyunları M.Ö. 776\'da Yunanistan\'ın Olimpia şehrinde düzenlendi. Modern olimpiyatlar ise 1896\'da Atina\'da yeniden başladı.' },
  { q: 'Rönesans hangi ülkede başladı?', options: ['Fransa', 'İspanya', 'İtalya', 'Almanya'], correct: 2, explanation: 'Rönesans (Yeniden Doğuş), 14. yüzyılda İtalya\'nın Floransa şehrinde başladı. Sanat, mimari, bilim ve felsefeyi derinden dönüştürdü.' },
  { q: 'Amerika\'yı Avrupalılar adına kim keşfetti?', options: ['Magellan', 'Vasco da Gama', 'Kristof Kolomb', 'Amerigo Vespucci'], correct: 2, explanation: 'Kristof Kolomb, 1492\'de İspanya adına Amerika\'ya ulaştı. Ancak kıtanın ismi, coğrafyayı belgelemesiyle ünlü Amerigo Vespucci\'den gelir.' },

  // --- COĞRAFYA ---
  { q: 'Dünyanın en uzun nehri hangisidir?', options: ['Amazon', 'Nil', 'Yangtze', 'Mississippi'], correct: 1, explanation: 'Nil Nehri, yaklaşık 6.650 km uzunluğuyla dünyanın en uzun nehridir. Etiyopya\'dan başlayıp Mısır üzerinden Akdeniz\'e dökülür.' },
  { q: 'Dünyanın en yüksek dağı hangisidir?', options: ['K2', 'Kangchenjunga', 'Everest', 'Lhotse'], correct: 2, explanation: 'Everest Dağı, 8.849 metre yüksekliğiyle dünyanın en yüksek zirvesidir. Nepal ile Tibet sınırında yer alır.' },
  { q: 'Okyanusların en derin noktası neresidir?', options: ['Bermuda Üçgeni', 'Mariana Çukuru', 'Puerto Rico Çukuru', 'Java Çukuru'], correct: 1, explanation: 'Büyük Okyanus\'taki Mariana Çukuru\'nun en derin noktası "Challenger Deep" yaklaşık 11.000 metre derinliktedir.' },
  { q: 'Avrupa\'nın en uzun nehri hangisidir?', options: ['Ren', 'Tuna', 'Volga', 'Elbe'], correct: 2, explanation: 'Volga Nehri, yaklaşık 3.530 km uzunluğuyla Avrupa\'nın en uzun nehridir. Rusya\'dan geçerek Hazar Denizi\'ne dökülür.' },
  { q: 'Türkiye kaç komşu ülkeyle sınır paylaşır?', options: ['6', '7', '8', '9'], correct: 2, explanation: 'Türkiye 8 ülkeyle sınır paylaşır: Yunanistan, Bulgaristan, Gürcistan, Ermenistan, Azerbaycan (Nahçıvan), İran, Irak ve Suriye.' },

  // --- SANAT & EDEBİYAT ---
  { q: 'Türk edebiyatının ilk romanı hangisidir?', options: ['İntibah', 'Taaşşuk-ı Talat ve Fitnat', 'Araba Sevdası', 'Zehra'], correct: 1, explanation: 'Şemseddin Sami\'nin yazdığı Taaşşuk-ı Talat ve Fitnat (1872), Türk edebiyatının genellikle ilk romanı olarak kabul edilir.' },
  { q: 'Mehmet Akif Ersoy\'un en ünlü şiiri hangisidir?', options: ['Çanakkale Şehitlerine', 'Seyfi Baba', 'İstiklal Marşı', 'Fatih Kürsüsünde'], correct: 2, explanation: 'Mehmet Akif Ersoy, 1921\'de yazdığı İstiklal Marşı ile ölümsüzleşmiştir. Şiiri bugün Türkiye\'nin ulusal marşı olarak okunmaktadır.' },
  { q: 'Dede Korkut hangi dönemde yaşamıştır?', options: ['Göktürk', 'Uygur', 'Oğuz Türkleri', 'Osmanlı'], correct: 2, explanation: 'Dede Korkut, Oğuz Türkleri dönemine ait destansi hikâyelerin anlatıcısı-kahramanıdır. Kitab-ı Dede Korkut, Türk edebiyatının temel eserleri arasındadır.' },
  { q: 'Şekspir hangi ülkede yaşamıştır?', options: ['Fransa', 'Almanya', 'İngiltere', 'İspanya'], correct: 2, explanation: 'William Shakespeare (1564-1616), İngiltere\'nin Stratford-upon-Avon şehrinde doğmuş ve Londra\'da yaşamıştır. Hamlet, Othello ve Romeo & Juliet başlıca eserleridir.' },

  // --- FELSEFE ---
  { q: 'Sokrates\'in en ünlü sözü hangisidir?', options: ['"Düşünüyorum, öyleyse varım"', '"Kendini bil"', '"Güzellik gözlemcinin gözündedir"', '"İnsan ölçütü her şeyin"'], correct: 1, explanation: '"Kendini Bil" (Gnothi Seauton) Sokrates\'in en temel öğretisidir. Delfi Tapınağı\'nın girişine de yazılıydı.' },
  { q: '"Cogito ergo sum" (Düşünüyorum, öyleyse varım) kimin sözüdür?', options: ['Kant', 'Platon', 'Descartes', 'Hegel'], correct: 2, explanation: 'René Descartes\'ın bu meşhur sözü, felsefe tarihinin dönüm noktasını oluşturur. Her şeyden şüphe etse de, şüphe eden bir "ben"in var olduğundan emin olduğunu ifade eder.' },
  { q: 'Aristoteles kimin öğrencisidir?', options: ['Sokrates', 'Platon', 'Tales', 'Epikür'], correct: 1, explanation: 'Aristoteles, Platon\'un Akademisi\'nde eğitim gördü. Platon da Sokrates\'in öğrencisiydi. Bu üçlü Antik Yunan felsefesinin temelini attı.' },

  // --- SPOR ---
  { q: 'FIFA Dünya Kupası kaç yılda bir düzenlenir?', options: ['2', '3', '4', '5'], correct: 2, explanation: 'FIFA Dünya Kupası, 1930\'dan beri her 4 yılda bir düzenlenmektedir. Savaş yılları olan 1942 ve 1946\'da düzenlenemedi.' },
  { q: 'Türkiye\'nin en köklü futbol kulübü hangisidir?', options: ['Beşiktaş', 'Fenerbahçe', 'Galatasaray', 'Trabzonspor'], correct: 0, explanation: 'Beşiktaş JK, 1903 yılında kurularak Türkiye\'nin en eski spor kulübü unvanını taşır.' },

  // --- GENEL KÜLTÜR ---
  { q: 'Dünya\'nın en kalabalık ülkesi hangisidir?', options: ['Hindistan', 'Çin', 'ABD', 'Endonezya'], correct: 0, explanation: '2023 itibarıyla Hindistan, yaklaşık 1.43 milyar nüfusuyla Çin\'i geçerek dünyanın en kalabalık ülkesi oldu.' },
  { q: 'Nobel Ödülü kaç farklı alanda verilir?', options: ['4', '5', '6', '7'], correct: 2, explanation: 'Nobel Ödülleri 6 alanda verilmektedir: Fizik, Kimya, Tıp, Edebiyat, Barış ve Ekonomi (1969\'dan itibaren). Alfred Nobel\'in vasiyetiyle kurulmuştur.' },
  { q: 'İnternetin mucidi kimdir?', options: ['Bill Gates', 'Steve Jobs', 'Tim Berners-Lee', 'Alan Turing'], correct: 2, explanation: 'Tim Berners-Lee, 1989\'da World Wide Web\'i icat etti. İnternetin temelini oluşturan bu sistem, bilgiye erişimi tamamen dönüştürdü.' },
  { q: 'Hangisi bir programlama dili değildir?', options: ['Python', 'Java', 'HTML', 'Kotlin'], correct: 2, explanation: 'HTML (HyperText Markup Language) bir programlama dili değil, işaretleme dilidir. Web sayfalarının yapısını tanımlamak için kullanılır.' },
  { q: 'Bal arısı bir kg bal için kaç çiçeği ziyaret eder?', options: ['100-200', '500-1000', '2.000.000', '50.000'], correct: 2, explanation: 'Bir kilo bal için arıların yaklaşık 2 milyon çiçeği ziyaret etmesi gerekir. Bir işçi arı ömrü boyunca yalnızca 1/12 çay kaşığı bal üretir.' },
  { q: 'Japon "origami" ne demektir?', options: ['Kağıt katlama sanatı', 'Fırça resmi', 'Çiçek düzenleme', 'Mürekkep boyama'], correct: 0, explanation: 'Origami, Japonca "kağıt katlamak" anlamına gelir (ori=katlamak, kami=kağıt). 17. yüzyılda Japonya\'da gelişen ve dünyaya yayılan bir sanattır.' },

  // --- EK İSLAM TARİHİ ---
  { q: 'Abbasi Halifeliği\'nin merkezi neresidir?', options: ['Şam', 'Bağdat', 'Kahire', 'Kurtuba'], correct: 1, explanation: 'Abbasi Halifeliği\'nin başkenti Bağdat\'tır. Harun Reşid döneminde Bağdat, dünyanın en büyük ve en gelişmiş şehri haline geldi.' },
  { q: 'Haçlı Seferleri kaç yıl sürmüştür?', options: ['50 yıl', '100 yıl', '200 yıl', 'Yaklaşık 200 yıl'], correct: 3, explanation: 'Haçlı Seferleri, 1096\'dan 1291\'e kadar yaklaşık 200 yıl sürmüştür. Bu süreçte 8 büyük sefer düzenlenmiştir.' },
  { q: 'Selahaddin Eyyubi Kudüs\'ü hangi yılda Haçlılardan geri aldı?', options: ['1147', '1187', '1212', '1248'], correct: 1, explanation: 'Selahaddin Eyyubi (Saladin), 1187\'de Hittin Savaşı\'nda Haçlıları mağlup ettikten sonra Kudüs\'ü 88 yıllık Haçlı işgalinden kurtardı.' },
  { q: 'Endülüs Emevi Halifeliği hangi şehirde kurulmuştu?', options: ['Granada', 'Sevilla', 'Kurtuba', 'Toledo'], correct: 2, explanation: 'Endülüs Emevi Halifeliği\'nin merkezi Kurtuba (Córdoba) şehriydi. 10. yüzyılda Kurtuba, Avrupa\'nın en büyük ve en gelişmiş şehriydi.' },
  { q: 'Pekin hangi ülkenin başkentidir?', options: ['Japonya', 'Kore', 'Çin', 'Vietnam'], correct: 2, explanation: 'Pekin (Beijing), Çin Halk Cumhuriyeti\'nin başkentidir. Yaklaşık 22 milyon nüfusuyla dünyanın en kalabalık şehirlerinden biridir.' },
];

/** Günün sorusunu döndürür — her gün farklı */
export function getDailyQuiz(): QuizQuestion {
  const today = new Date();
  const startOfYear = new Date(today.getFullYear(), 0, 0);
  const dayOfYear = Math.floor((today.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
  return QUIZ_POOL[dayOfYear % QUIZ_POOL.length];
}
