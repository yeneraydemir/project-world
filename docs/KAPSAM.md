# Project World — Yeniden kurulum kapsamı

Bu belge kullanıcıyla alınan kararları korur. Eski uygulamanın dosyaları kurtarılamamıştır; yeni sürüm bu kapsamdan yeniden geliştirilir.

## Ürün
- SimCity benzeri, izometrik 3D işletme dünyası.
- İşletme / lojistik ve İnşaat sekmeleri.
- İnşa et, canlı operasyonlar ve ayrı senaryo.
- Profesyonel kullanım için sade Türkçe arayüz; tek + Ekle, kayıt listeleri ve seçince açılan detay paneli.
- Alt video / oynatıcı şeridi olmayacak. Takvim ve hız ayrı panelde.

## İnşaat
- İnşaat 1: üç büyük yapının bulunduğu örnek şantiye.
- İnşaat 2 ve 3: bağımsız 60 × 60 m boş araziler.
- Ayrı havuzlu villa ve villa yerleşkesi örnekleri.
- Yapı, villa veya tek katlı ev; en az 5 × 5 m taban; kare veya dikdörtgen; kat sayısı, çatı, bütçe, başlangıç ve bitiş tarihi.
- Arazide tıklama / sürükleme ile yapı yerleşimi; çakışma ve arazi sınırı kontrolü.
- Takvimle yapım aşamaları; 0,5× / 1× / 2× / 5×; bitişte tamamlanmış görünüm.
- Çalışan adı ve soyadı, uzmanlık, vardiya, bina ve konteyner ataması.
- Çalışan / ekip lideri / yetkili için farklı baret ve yelek renkleri.
- İşçi konaklama konteynerleri; kapasite ve doluluk kontrolü.
- Beton mikseri, ekskavatör ve malzeme kamyonu; plaka, sürücü ve bina ataması.
- Araç kartından sürücüye, sürücü kartından araca geçiş.
- Mikser kapalı dönüş rotasında; tekerlekler yol mesafesine, tambur kendi eksenine bağlı.
- Malzeme girişi, stok ve minimum stok uyarıları.
- Görev, sorumlu, bina, termin ve durum.
- Havuz, çim, yol, teras, ağaç, çit, pergola, ışık; parsel sınırı ve giriş kapısı.
- Havuz için kazı, gövde, kaplama ve su dolumu; villa çatı ilerlemesi.
- Kayıt arama, seçerek düzenleme, geri alma, işlem günlüğü.

## İşletme ve lojistik
- Depo, fabrika, ofis, yol, ağaç, depo içi raf ve palet.
- Nesne adı, boyutu, konumu, renk; taşıma, çoğaltma ve silme.
- Depoya girme; raf ve paletlerin depo sınırında kalması.
- İşleme tıklayınca ilgili tesis, yük ve araçlar, sayısal miktarlar.
- Nakliye, üretim, tedarik, depo transferi; plaka ve işlem araması.
- Araç / sürücü / kapasite kayıtları.
- Yükleme → hazır → yolda → teslim; kapasite ve çifte aktif görev kontrolü.
- Şematik rota ve yol kesimi; canlı GPS gibi sunulmayacak.
- Ana dünyadan bağımsız senaryo, kapasite ve talep karşılaştırması.

## Kayıt ve entegrasyon
- Yerel tarayıcı kaydı + JSON dışa / içe aktarma.
- Kaynak kodu ve veri farklıdır: GitHub kodu korur; kullanıcının saha kayıtları JSON ile yedeklenir.
- Kapsio için özel İnşaat Modülü planı. Diğer 41 modülle veri eşleme sonraki aşama; bağlantı kurulmadan bağlı gibi gösterilmeyecek.
- Çok kullanıcılı sunucu kaydı, bordro, gerçek GPS ve resmî mühendislik hesapları ilk prototipe dahil değildir.

## Kalıcılık
- Ana kaynak: https://github.com/yeneraydemir/project-world (özel).
- Kaynak, talimatlar, testler ve sürüm geçmişi GitHub'a yazılmalı.
- Sadece Sites'e yayın veya çalışma alanında ZIP oluşturma, GitHub yedeği olarak kabul edilmez.
- Her tamamlanan değişiklikten sonra uzak commit ve dosya listesi doğrulanır.
- Site yayını GitHub kaydından sonra yapılır.
- GitHub'daki koddan bağımlılıkları sabit sürümle kurup uygulama yeniden üretilebilmelidir.

## 29 Ekim: Proje / şirket, konum ve yapı hiyerarşisi
- İnşaat ve işletme alanları ayrı proje/şirket portföyleri içerir.
- Bir proje/şirket birden fazla şehir ve adreste konum/yerleşke barındırır.
- Her konumda fiziksel yapılar; her yapıda bağımsız ofis, daire, dükkân ve diğer birimler bulunabilir.
- Yerleşke tipi ile yapı tipi ayrıdır: villa sitesi bir yerleşke, villa bir yapı, plaza içindeki ofis bir birimdir.
- Hazır konum şablonları: boş arazi, tek bina, apartman/rezidans/villa/müstakil yerleşkesi, karma, kampüs, sanayi, tek ofis, müstakil dükkân ve mağaza yerleşkesi.
- Yeni şirket/proje sihirbazında birden fazla şehir virgülle girilir; her şehirde bağımsız bir konum oluşturulur. Her konuma başka yapılar ve birimler eklenebilir.
- Üst toplamlar tüm portföyü, sahne sayaçları yalnızca açık konumu temsil eder. Şehir ve yapı/birim türü filtreleri vardır.
- Eski v2 kayıtları kimlikleri, atamaları ve örnekleri korunarak hiyerarşiye tamamlanır. Depo kaydı kaynak kodundan ayrıdır.
- Sınırlar: 50 proje/şirket; 100 konum; her konumda 12 yapı ve 300 bağımsız birim. Her konum ayrı 60×60 m temsili sahnedir. Şehir etiketleri gerçek harita veya GPS değildir.

### Günlük saha operasyonları (veri şeması v3)
- Bugün ekranı aynı proje/şirketin konumlarındaki gecikmeleri, açık görevleri ve beklenen teslimatları Türkiye takvimine göre sıralar. Kayıttan doğru sahne ve yapıya geçilir.
- Yapım aşaması: plan başlangıcı/hedef bitiş, gerçekleşen yüzde, üç fotoğraf, sorumlu ve saha notu. Plan animasyonu saha ilerlemesinden ayrı kalır.
- Bakım/arıza yapı, bağımsız bölüm ve ekipman adıyla izlenir. Malzeme teslimatında araç, sürücü, son bildirilen yol, hedef ve beklenen tarih görülür. Teslim alma kaydı stoğa bir kez işler.
- Mevcut v2 kayıtları otomatik taşınır. Kayıtlar ve küçük fotoğraflar tarayıcıya ve JSON yedeğine yazılır.
- Kapsio dosya köprüsü: Personel (İK), araç/sürücü (Filo) ve stok/malzeme (Stok/Depo) hazırlanmış JSON ile konum bazında alınır. Saha kayıtları İnşaat modülü için ayrı JSON'a çıkar; fotoğraflar normal dünya yedeğinde kalır. Şablon ve eşleştirme Project World sözleşmesidir, doğrudan yerel Kapsio dışa aktarım biçimi değildir. Canlı API senkronizasyonu ve GPS bağlı değildir.

### Sade çalışma alanı
- Lacivert üst şerit, açık paneller ve mavi ana aksiyonlar. Bugün ve Ekle 3D sahne araç çubuğunda; proje özeti, animasyon takvimi ve alanı sıfırlama Görünüm altında.
- Konum ve kayıtlar Alan, Ekip ve İşler başlıklarında. Yedek, kaydetme ve rehber Araçlar menüsünde. Dar ekranlarda kayıtlar ayrı açılır, detay paneli sahnenin altına yerleşir.
- Veri şeması, tarayıcı kayıt anahtarı ve operasyon akışları aynı.

### Cam yüzeyli çalışma alanı
- Kayıt paneli masaüstünde ve mobilde sahne üzerinden açılıp kapanır. Açık kategorideki yeni kayıt yan panelden tek tıkla başlatılır; genel ekleme menüsü Alan, Ekip ve İşler olarak gruplanır.
- Açık renk cam yüzeyler, okunaklı metin ve saydamlığı azaltan sistem tercihleri için opak görünüm. Saha verileri ve kayıt biçimi değişmedi.

### Türkiye sevkiyat haritası — v4
- 81 il merkezi arasındaki OSRM yol rotası, kalkış ve tahmini varış (Türkiye +03) ile sevkiyata / malzeme teslimatına bağlanır. Aynı proje/şirketin konumlarındaki rotalar harita seçiminde birlikte gösterilir.
- Plaka, sürücü, rota mesafesi, kalan süre ve yol üzerinde zamanla ilerleyen araç simgesi. İlerleme takvim animasyonundan bağımsızdır, gerçek saatten hesaplanır.
- Kaydedilmiş rota çevrimdışı görüntülenir; yeni rota için OSRM internet erişimi gerekir. Servis çalışmazsa kayıt yapılmaz; düz çizgi gerçek yol diye sunulmaz. Yalnız iki şehir merkezi koordinatı gönderilir.
- Harita Natural Earth 110m ülke geometrisidir: https://github.com/nvkelso/natural-earth-vector (public domain). Yollar OSRM / OpenStreetMap (ODbL). Canlı GPS, trafik ve tır kısıtları yoktur. V2/v3 kayıtları V4'e taşınır.

### 81 il haritası
- Yerel ODbL GeoJSON verisinden 81 ilin ayrı poligonları, plaka kodları ve isteğe bağlı il adları.
- Fare, dokunma veya klavye ile il seçimi, il odaklama, yakınlaştırma, sürükleme ve Türkiye geneline dönme. İl listesi Türkçe sıralıdır.
- Seçili ilin kalkış, varış ve rota noktası eşleşen sevkiyatları filtrelenir; mevcut saat bazlı araç simgesi devam eder. Resmi sınır/kadastro amaçlı değildir.

### Haritadan sevkiyat ve ana yol katmanı
- Natural Earth kaynaklı 228 genelleştirilmiş ana ve bağlantı yol parçası, Türkiye il sınırına kırpılarak çizilir; ana yol etiketleri ve katman anahtarı vardır. Veri güncel tüm otoyol envanteri değildir.
- Plaka rozetlerinin merkezleri il poligonunun içinde en geniş boşluğu veren noktaya hesaplanır; 81 etiketin sınır içinde olması test edilir.
- Haritadan tesis, araç, yük, kalkış/varış şehri ve saatleriyle sevkiyat oluşturulur. Kayıt normal operasyon listesine eklenir; eski kayıtlar korunur.
- Kapsio bağlantı ayarı, POST adaptörü, idempotency başlığı ve kayıt kimliğiyle onaylama eklendi. Kapsio uç noktası/dokümanı/erişim bilgisi olmadığı için canlı eşitleme henüz bağlı ve doğrulanmış değildir (docs/KAPSIO-API.md).

### Yol haritası düzeltmesi
- Eksik Natural Earth çizgi katmanı çalışma anından kaldırıldı. OpenStreetMap raster harita parçaları yalnız görünür alan için, Web Mercator hizalamasıyla yüklenir; tarayıcı önbellek kuralları korunur.
- İl sınırları, ortalanmış plakalar ve araç rotaları aynı projeksiyonda üst üste gelir. Mavi hover/seçim dolgusu ve SVG kutu odağı kaldırıldı; klavye odağı ince gri kesik çizgiyle belirtilir.
- Yol haritası internet gerektirir; yüklenemeyen parçalar için kullanıcıya hata gösterilir. Yol haritası kapatılınca il/rota katmanları yerel olarak kullanılabilir.

### Yönlenen araç ve otomatik API gönderimi
- Harita araç simgesi gölgeli, kabin/kasa/tekerlekli 3D görünümlü SVG modelidir. Yol yönüne döner ve gerçek plan saatine göre animasyon karesiyle ilerler. Canlı GPS değildir.
- Haritadan oluşturulan yeni sevkiyat API bekleyen işaretiyle kaydedilir. Bağlantı oturumda yapılandırılmışsa otomatik gönderilir; bağlantı daha sonra açılırsa bekleyen yeni kayıtlar gönderilir.
- API anahtarı yalnız sekme belleğinde olduğundan sekme kapalıyken eşitleme çalışmaz. Kapsio gerçek endpoint ve kimlik doğrulama bilgileri hâlâ eksik; sürekli sunucu eşitlemesi bağlı değildir.
