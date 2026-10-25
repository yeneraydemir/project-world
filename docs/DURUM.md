# Uygulama durumu — 1.0 yeniden kurulum

## Uygulandı
- Altı bağımsız çalışma alanı: üç şantiye, havuzlu villa, villa yerleşkesi, işletme.
- Yapı türü, 5×5 m minimum ölçü, en/boy, kat, çatı, bütçe, başlangıç/bitiş tarihi, konum ve renk.
- Takvim ilerlemesi, planın sonunda tamamlanmış görünüm; ayrı takvim paneli, alt oynatıcı yok.
- Çalışan, yetki/görünüm, konaklama, araç, plaka/sürücü, görev, stok ve uyarılar.
- Peyzaj, havuzun takvime bağlı su görünümü, parsel ve kapı.
- 3D seçim, kayıt formları, arama, geri alma; tarayıcı kaydı ve şema doğrulamalı JSON aktarımı.
- Depo içi raf/palet yerleşimi; depo küçültmede iç nesne sınırı kontrolü.
- İşlem miktarları, kapasite kontrollü araç ataması, yükleme/çıkış/örnek konum ilerlemesi.
- Şematik rota, ana dünyadan ayrı senaryo ve talep/kapasite karşılaştırması.
- GitHub kaynak deposu ve kilitli bağımlılıktan tekrarlanabilir kurulum.

## Doğrulama
- 18 veri ve davranış testi geçti.
- Sözdizimi kontrolü ve yerel Three.js varlık derlemesi geçti.
- Tarayıcı görsel/etkileşim kontrolü henüz tamamlanmadı.

## Önceki kapsamla farklar / sonraki işler
- Eski dosyalar kurtarılamadığı için görseller ve veri şeması yeniden oluşturuldu. Eski v1 dünya dosyası içe aktarma şu an desteklenmez; v2 dosyaları kabul edilir.
- 90° nesne döndürme kısayolu ve yön parametresi bu sürümde yoktur. Konum, en/boy ve kamera döndürme kullanılabilir.
- Kat planı ve çok detaylı havuz kazı/tesisat modellemesi sadeleştirilmiştir.
- Depo içi nesneler için raf/palet ile duvar sınırı kontrolü vardır; iki iç nesnenin birbirine çakışması henüz denetlenmez.
- Binaların taşınması konum alanlarıyla yapılır; doğrudan nesne sürükleme sonraki aşamadır.
- İşletme işlemleri yerel kayıtlardır. Fiziksel stok rezervasyonu, muhasebe, gerçek GPS, Kapsio API, oturumlu bulut kaydı veya çok kullanıcı yoktur.
- GitHub Actions kontrol dosyası hazırlanmıştır; etkin çalıştığı ayrıca doğrulanmalıdır.
