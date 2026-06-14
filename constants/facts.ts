
export interface QuickFact {
  id: string;
  title: string;
  desc: string;
  category: string;
  image: string;
  color: string;
}

export const QUICK_FACTS: QuickFact[] = [
  {
    id: '1',
    title: 'Nöroplastisite Mucizesi',
    desc: 'İnsan beyninin deneyimlere bağlı olarak fiziksel yapısını değiştirebilme yeteneğine nöroplastisite denir. Önceleri beynin belirli bir yaştan sonra gelişmeyi durdurduğu sanılırdı. Ancak yeni araştırmalar, yeni bir dil öğrenmenin veya bir enstrüman çalmanın beyinde yeni nöral ağlar oluşturduğunu gösteriyor. Bu özellik sayesinde ileri yaşlarda bile beynimizi genç ve dinamik tutmak, hafızayı güçlendirmek ve yepyeni beceriler edinmek tamamen bizim elimizdedir.',
    category: 'Tıp',
    image: 'https://images.unsplash.com/photo-1507668077129-56e32842fceb?q=80&w=400&auto=format&fit=crop',
    color: '#FF6B6B',
  },
  {
    id: '2',
    title: 'Geleceğin Enerjisi: Füzyon',
    desc: 'Nükleer füzyon, güneşin ve diğer yıldızların enerji üretme yöntemidir. Atom çekirdeklerinin muazzam bir ısı altında birleşerek devasa enerji açığa çıkarması esasına dayanır. Eğer bilim insanları dünyada füzyon reaksiyonlarını güvenli ve sürekli bir şekilde kontrol altına almayı başarırlarsa, insanlık karbon salınımı olmayan, radyoaktif atık bırakmayan ve deniz suyundan elde edilen yakıtla neredeyse sınırsız bir temiz enerji kaynağına kavuşmuş olacak.',
    category: 'Mühendislik',
    image: 'https://images.unsplash.com/photo-1506703719100-a0f3a48c0f86?q=80&w=400&auto=format&fit=crop',
    color: '#4D96FF',
  },
  {
    id: '3',
    title: 'Zeno Paradoksu',
    desc: 'Antik Yunan filozofu Elealı Zeno, hareketin aslında bir yanılsama olduğunu savunmuştur. En meşhur paradoksunda şöyle der: Bir hedefe varmak için önce yolun yarısını gitmelisiniz. Sonra kalan yarısını, sonra onun da yarısını... Bu sonsuza kadar böyle devam edeceği için teknik olarak hedefinize asla tam anlamıyla ulaşamazsınız. Bu düşünce deneyi, asırlar boyunca matematikçileri sonsuzluk ve limit kavramlarını geliştirmeye itmiş, modern kalkülüsün temellerinin atılmasına ilham olmuştur.',
    category: 'Felsefe',
    image: 'https://images.unsplash.com/photo-1509023464722-18d996393ca8?q=80&w=400&auto=format&fit=crop',
    color: '#6BCB77',
  },
  {
    id: '4',
    title: 'Yapay Zekanın Temeli',
    desc: 'Derin öğrenme (Deep Learning), insan beynindeki biyolojik sinir ağlarından ilham alan ve verileri işlemek için çok katmanlı algoritmalar kullanan bir makine öğrenimi yöntemidir. Bugün otonom araçlardan tıbbi teşhis koyan yazılımlara, dil çevirmenlerinden sanat üreten yapay zekalara kadar kullandığımız tüm gelişmiş sistemler, bu devasa sanal nöron ağlarının milyarlarca veriyi saniyeler içinde analiz edip örüntüleri tanıması sayesinde çalışmaktadır.',
    category: 'Teknoloji',
    image: 'https://images.unsplash.com/photo-1677442136019-21780ecad995?q=80&w=400&auto=format&fit=crop',
    color: '#9B51E0',
  },
  {
    id: '5',
    title: 'DNA Veri Depolama',
    desc: 'Teknolojinin ulaştığı son noktalardan biri: DNA üzerine veri yazmak! Sadece 1 gram DNA, tam 215 petabayt (yaklaşık 220 milyon gigabayt) veriyi dış etkenlerden korunması halinde binlerce yıl boyunca bozulmadan saklayabilir. Bu, günümüzde dünyadaki tüm internet verisinin sadece bir ayakkabı kutusu büyüklüğündeki DNA havuzuna sığdırılabileceği anlamına geliyor. Gelecekte sabit disklerin yerini tamamen biyolojik veri depoları alabilir.',
    category: 'Biyoteknoloji',
    image: 'https://images.unsplash.com/photo-1530026405186-ed1f139313f8?q=80&w=400&auto=format&fit=crop',
    color: '#FFD93D',
  },
  {
    id: '6',
    title: 'Arıların Matematiksel Dansı',
    desc: 'Bal arıları, yeni bir besin kaynağı bulduklarında kovanlarına döner ve diğer arılara yön tarif etmek için petek üzerinde "sekiz" şekline benzer, titrek bir dans yaparlar (Waggle Dance). Bu dansın yapılış açısı Güneş\'e olan yönü tam olarak belirtirken, dansın süresi hedefin ne kadar uzakta olduğunu gösterir. Yani arılar, güneşi bir pusula gibi kullanarak tamamen matematiksel ve geometrik bir dille kusursuz bir harita iletişimi kurarlar.',
    category: 'Doğa',
    image: 'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=400&auto=format&fit=crop',
    color: '#F9A825',
  },
  {
    id: '7',
    title: 'Altın Oran (1.618)',
    desc: 'Fibonacci dizisiyle doğrudan bağlantılı olan 1.618 (Phi) oranı, insan gözüne en estetik ve kusursuz gelen matematiksel orandır. Papatya yapraklarının diziliminden ayçiçeği çekirdeklerine, deniz kabuklarının spirallerinden galaksilerin şekline kadar doğanın her köşesine kodlanmıştır. Aynı zamanda Mısır Piramitleri\'nden Da Vinci\'nin Mona Lisa tablosuna ve modern mimariye kadar sayısız eserde güzelliğin anahtarı olarak bilinçli bir şekilde kullanılmıştır.',
    category: 'Sanat',
    image: 'https://images.unsplash.com/photo-1546948630-1149ea60dc86?q=80&w=400&auto=format&fit=crop',
    color: '#8D6E63',
  },
  {
    id: '8',
    title: 'Evrenin Genişlemesi',
    desc: '1920\'lerde astronom Edwin Hubble, uzak galaksilerden gelen ışığın kırmızıya kaydığını (Redshift) gözlemleyerek şok edici bir gerçeği ortaya çıkardı: Evren statik değildi ve sürekli olarak genişliyordu. Tıpkı şişen bir balonun üzerindeki noktaların birbirinden uzaklaşması gibi, galaksiler de birbirinden büyük bir hızla uzaklaşmaktaydı. Bu devrim niteliğindeki keşif, evrenin bir başlangıcı olduğunu savunan Büyük Patlama (Big Bang) teorisinin en güçlü kanıtı olmuştur.',
    category: 'Astronomi',
    image: 'https://images.unsplash.com/photo-1446776811953-b23d57bd21aa?q=80&w=400&auto=format&fit=crop',
    color: '#3F51B5',
  },
  {
    id: '9',
    title: 'Mimar Sinan\'ın Akustiği',
    desc: 'Mimar Sinan, inşa ettiği devasa yapılarla sadece mühendislik değil, aynı zamanda mükemmel bir akustik ustası olduğunu da kanıtlamıştır. Özellikle Süleymaniye Camii\'nde, imamın sesinin mikrofonsuz bir şekilde her köşeye eşit iletelmesi için ana kubbenin ve köşelerin etrafına ağızları içe dönük 64 adet boş küp yerleştirmiştir. Yüzyıllar önce tasarlanan bu eşsiz yalıtım ve yankı sistemi, günümüz modern mimarisinde bile hayranlık uyandırmaya devam etmektedir.',
    category: 'Mimari',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?q=80&w=400&auto=format&fit=crop',
    color: '#795548',
  },
  {
    id: '10',
    title: 'Okyanusların Sırrı',
    desc: 'Gezegenimizin %71\'ini kaplayan okyanusların, günümüz itibariyle hala %80\'inden fazlası haritalanmamış, gözlemlenmemiş ve keşfedilmeyi beklemektedir. İnanması güç olsa da, Ay\'ın ve hatta Mars\'ın yüzeyini, kendi gezegenimizdeki okyanus tabanlarından çok daha detaylı bir şekilde biliyoruz. Derin denizler; bilinmeyen devasa deniz canlılarına, dev denizaltı şelalelerine ve belki de henüz tıpta devrim yaratacak yeni moleküllere ev sahipliği yapıyor.',
    category: 'Coğrafya',
    image: 'https://images.unsplash.com/photo-1518173946687-a4c8892bbd9f?q=80&w=400&auto=format&fit=crop',
    color: '#0288D1',
  },
  {
    id: '11',
    title: 'Kanallar Şehri Venedik',
    desc: 'Venedik, 118 küçük adanın üzerine inşa edilmiş, sokakları su yollarıyla örülmüş ve 400\'den fazla köprüyle birbirine bağlanmış eşsiz bir şehirdir. Arabaların tamamen yasak olduğu bu tarihi bölgede tüm ulaşım vaporetolar ve meşhur gondollarla sağlanır. Zamanla sular altında kalma tehlikesiyle karşı karşıya olan bu rüya şehir, Rönesans mimarisinin ve sanatın en görkemli örneklerini barındıran devasa bir açık hava müzesi gibidir.',
    category: 'Şehirler',
    image: 'https://images.unsplash.com/photo-1527631746610-bca00a040d60?q=80&w=400&auto=format&fit=crop',
    color: '#E65100',
  },
  {
    id: '12',
    title: 'Mavi Şehir: Semerkant',
    desc: 'İpek Yolu\'nun kalbinde yer alan Semerkant, İslam dünyasının en önemli bilim, kültür ve sanat merkezlerinden biridir. Özellikle Timur İmparatorluğu döneminde inşa edilen turkuaz renkli ihtişamlı kubbeleri, çinilerle süslü medreseleri ve o dönemin en gelişmiş rasathaneleriyle ünlüdür. "İslam\'ın İncisi" olarak bilinen bu masalsı şehir, astronomi ve matematikte dünya tarihine yön veren pek çok efsanevi alim yetiştirmiştir.',
    category: 'İslam Şehirleri',
    image: 'https://images.unsplash.com/photo-1564507004663-b6dfb3c824d5?q=80&w=400&auto=format&fit=crop',
    color: '#006064',
  },
  {
    id: '13',
    title: 'Kuantum Dolanıklık',
    desc: 'Albert Einstein\'ın "uzaktan ürkütücü etkileşim" olarak adlandırdığı kuantum dolanıklık, iki veya daha fazla parçacığın birbirine öyle bir bağlanmasıdır ki, aralarında evrenin zıt uçları kadar mesafe olsa bile birindeki değişim anında diğerini etkiler. Bu fenomen, ışık hızından daha hızlı bir bilgi aktarımının imkansız olduğu klasik fiziğe meydan okur ve geleceğin ultra güvenli kuantum internetinin temelini oluşturur.',
    category: 'Kuantum',
    image: 'https://images.unsplash.com/photo-1635070041078-e363dbe005cb?q=80&w=400&auto=format&fit=crop',
    color: '#673AB7',
  },
  {
    id: '14',
    title: 'Ağaçların Gizli İnterneti',
    desc: 'Ormanlardaki ağaçlar sadece bağımsız canlılar değildir. Toprağın altındaki devasa miselyum (mantar) ağları sayesinde, adeta devasa bir biyolojik internet ile (Wood Wide Web) birbirlerine bağlıdırlar. Bu ağ üzerinden yaşlı ağaçlar genç fidanlara besin gönderir, hastalanan ağaçlar diğerlerini yaklaşan böcek tehlikelerine karşı uyarır ve orman tek bir dev organizma gibi hareket eder.',
    category: 'Biyoloji',
    image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?q=80&w=400&auto=format&fit=crop',
    color: '#2E7D32',
  },
  {
    id: '15',
    title: 'Pi Sayısının Sonsuzluğu',
    desc: 'Pi (π) sayısı, bir dairenin çevresinin çapına bölümüdür ve virgülden sonrası sonsuza kadar hiçbir düzenli tekrar olmadan devam eder. Bu muazzam düzensizlik ve sonsuzluk şu anlama gelir: Evrendeki var olan veya var olabilecek tüm kitaplar, doğum tarihiniz, şifreleriniz ve hatta DNA diziliminiz Pi sayısının içinde bir yerlerde kodlanmış olarak mevcuttur.',
    category: 'Matematik',
    image: 'https://images.unsplash.com/photo-1509228468518-180dd4864904?q=80&w=400&auto=format&fit=crop',
    color: '#E91E63',
  },
  {
    id: '16',
    title: 'Endülüs Kütüphaneleri',
    desc: 'Orta Çağ\'da Avrupa büyük bir karanlık çağ yaşarken ve krallar dahi okuma yazma bilmezken, İspanya\'daki Endülüs Emevi Devleti bilim ve kültürün altın çağını yaşıyordu. Kurtuba şehrindeki sadece ana kütüphanede 400.000\'den fazla el yazması kitap bulunuyordu. Sokakların aydınlatıldığı, hamamların ve hastanelerin ücretsiz hizmet verdiği bu dönem, modern Avrupa medeniyetinin uyanışına öncülük etmiştir.',
    category: 'Tarih',
    image: 'https://images.unsplash.com/photo-1507842217343-583bb7270b66?q=80&w=400&auto=format&fit=crop',
    color: '#5D4037',
  },
  {
    id: '17',
    title: 'Işık Hızı ve Zaman',
    desc: 'Işık hızı saniyede yaklaşık 300.000 kilometredir ve evrendeki bilinen en yüksek hız sınırıdır. Einstein\'ın İzafiyet Teorisi\'ne göre, bir cisim ışık hızına yaklaştıkça onun için zaman daha yavaş akmaya başlar. Eğer ışık hızının %99\'u bir hızla uzayda 5 yıl seyahat edip dünyaya dönerseniz, sizin için 5 yıl geçmişken dünyadakiler için onlarca yıl geçmiş olacaktır.',
    category: 'Fizik',
    image: 'https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?q=80&w=400&auto=format&fit=crop',
    color: '#00BCD4',
  }
];
