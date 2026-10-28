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
