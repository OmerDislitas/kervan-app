
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
    id: '6',
    title: 'Arıların Matematiksel Dansı',
    desc: 'Bal arıları, yeni bir besin kaynağı bulduklarında kovanlarına döner ve diğer arılara yön tarif etmek için petek üzerinde "sekiz" şekline benzer, titrek bir dans yaparlar (Waggle Dance). Bu dansın yapılış açısı Güneş\'e olan yönü tam olarak belirtirken, dansın süresi hedefin ne kadar uzakta olduğunu gösterir. Yani arılar, güneşi bir pusula gibi kullanarak tamamen matematiksel ve geometrik bir dille kusursuz bir harita iletişimi kurarlar.',
    category: 'Doğa',
    image: 'https://images.unsplash.com/photo-1473973266408-ed4e27abdd47?q=80&w=400&auto=format&fit=crop',
    color: '#F9A825',
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
];
