export interface MindCard {
  id: string;
  category: string;
  front: string;
  frontDesc: string;
  back: string;
  color: string;
}

export const MIND_CARDS_DATA: MindCard[] = [
  {
    id: '1',
    category: 'Paradoks',
    front: 'Theseus\'un Gemisi',
    frontDesc: 'Bir geminin tüm parçaları zamanla değiştirilirse, o gemi hala aynı gemi midir?',
    back: 'Kimlik Paradoksu. Bu paradoks, bir nesnenin temelinin parçaları mı yoksa formu mu olduğunu sorgular. Sizce ruh mu kalıcıdır, beden mi?',
    color: '#8A2BE2'
  },
  {
    id: '2',
    category: 'Kelime',
    front: 'Hissikablelvuku',
    frontDesc: 'Kökü Arapça olan bu eski ve zarif kelimenin anlamı nedir?',
    back: 'Bir şeyin olacağını önceden hissetme durumu, altıncı his, önsezi. Kalbinin sana fısıldadığı o an.',
    color: '#FF6B6B'
  },
  {
    id: '3',
    category: 'Tarih',
    front: 'Göbeklitepe',
    frontDesc: 'Şanlıurfa\'da bulunan bu yapının tarih kitaplarını değiştiren özelliği nedir?',
    back: 'Dünyanın bilinen en eski tapınak merkezidir. Yaklaşık 12.000 yıllıktır, Stonehenge\'den 7.000, Piramitlerden 7.500 yıl daha eskidir.',
    color: '#4D96FF'
  },
  {
    id: '4',
    category: 'Bilim',
    front: 'Büyük Filtre',
    frontDesc: 'Evren neden sessiz? Eğer çok fazla gezegen varsa, uzaylılar nerede?',
    back: '"Büyük Filtre" teorisine göre, tüm uygarlıkları galaktik boyuta ulaşmadan yok eden büyük ve aşılması zor bir engel vardır. Acaba biz o engeli geçtik mi?',
    color: '#00C9A7'
  },
  {
    id: '5',
    category: 'Felsefe',
    front: 'Mağara Alegorisi',
    frontDesc: 'Platon\'un anlattığı mağaradaki tutsaklar neyi temsil eder?',
    back: 'Gerçekliği sadece gölgelerden ibaret sanan bizleri temsil eder. Platon, duyularımızla algıladığımız dünyanın sadece bir yansıma olduğunu savunur.',
    color: '#FFB84C'
  },
  {
    id: '6',
    category: 'Bilim',
    front: 'Kelebek Etkisi',
    frontDesc: 'Brezilya\'da kanat çırpan bir kelebek, Teksas\'ta fırtınaya yol açabilir mi?',
    back: 'Kaos Teorisi. Küçük ve önemsiz gibi görünen başlangıç koşullarındaki ufak değişikliklerin, devasa ve öngörülemez sonuçlar doğurabileceğini anlatır.',
    color: '#2D46B9'
  },
  {
    id: '7',
    category: 'Kelime',
    front: 'Diğerkâmlık',
    frontDesc: 'Farsça kökenli bu derin kelime hangi erdemi anlatır?',
    back: 'Başkalarının yararını kendi yararından üstün tutma, özgecilik, fedakârlık. Egoizmin tam zıttı olan erdemdir.',
    color: '#E0144C'
  },
  {
    id: '8',
    category: 'Tarih',
    front: 'Voynich El Yazması',
    frontDesc: 'Dünyanın en gizemli kitabının sırrı nedir?',
    back: '15. yüzyıla ait, bilinmeyen bir dilde ve alfabe ile yazılmış, dünyanın hiçbir yerinde bulunmayan bitki çizimleriyle dolu bir kitaptır. Hâlâ çözülememiştir.',
    color: '#1A5D1A'
  },
  {
    id: '9',
    category: 'Paradoks',
    front: 'Schrödinger\'in Kedisi',
    frontDesc: 'Kutunun içindeki kedi hem ölü hem de diri olabilir mi?',
    back: 'Kuantum fiziğindeki süperpozisyon ilkesini anlatır. Gözlem yapılana kadar olasılıkların aynı anda var olması durumudur.',
    color: '#610C9F'
  },
  {
    id: '10',
    category: 'Kelime',
    front: 'Gubar-ı Gam',
    frontDesc: 'Hüznün en edebi hali olan bu kelime grubu ne anlama gelir?',
    back: 'Gam tozu, hüzün zerresi. İnsanın kalbine çöken o ince, belli belirsiz ama ağır hüzün tabakasını tarif eder.',
    color: '#D27685'
  },
  {
    id: '11',
    category: 'Felsefe',
    front: 'Amor Fati',
    frontDesc: 'Nietzsche\'nin sıkça kullandığı bu Latince deyişin anlamı nedir?',
    back: '"Kaderini sev." Hayatın getirdiği iyisiyle kötüsüyle her şeyi kabullenip, ondan kaçmak yerine onu kucaklamayı ifade eder.',
    color: '#E9A178'
  },
  {
    id: '12',
    category: 'Bilim',
    front: 'Karanlık Madde',
    frontDesc: 'Evrenin %85\'ini oluşturan ama göremediğimiz şey nedir?',
    back: 'Işıkla etkileşime girmeyen, sadece yerçekimsel etkisiyle varlığını bildiğimiz gizemli maddedir. Evreni bir arada tutan görünmez yapıştırıcıdır.',
    color: '#0B2447'
  }
];
