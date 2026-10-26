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
- 22 veri ve davranış testi: döndürme, sınırda geri alma, depo içi çakışma ve havuz aşamaları eklendi.
- Sözdizimi kontrolü ve yerel Three.js varlık derlemesi geçti.
- Canlı yayında Chrome ile gerçek WebGL sahnesi, şantiye/villa geçişi, çalışan/yetki kaydı, araç/sürücü ataması, geri alma, sevkiyat miktarı güncellemesi, 390 px mobil düzen ve takvim 2× ilerlemesi kontrol edildi. Konsolda uygulama hatası görülmedi.
- Dahili önizleme adresi bulut tarayıcısında engellendi; görsel kontrol yayımlanan sürümde yapıldı.

## Önceki kapsamla farklar / sonraki işler
- Eski dosyalar kurtarılamadığı için görseller ve veri şeması yeniden oluşturuldu. Eski v1 dünya dosyası içe aktarma şu an desteklenmez; v2 dosyaları kabul edilir.
- 90° döndürme ve R kısayolu geri getirildi; en/boy eksenleri yer değiştirir. Depo içi nesneler merkez etrafında birlikte döner. Sınır/çakışma halinde değişiklik geri alınır.
- Havuz kazı → beton gövde → kaplama/tesisat → su dolumu → hazır aşamalarını izler. Çatı oluşumu kademelidir. Ağaç hareketleri ve açık dorsede yüklenen paletler eklendi.
- Depo içinde duvar sınırı ve raf/palet çakışma kontrolü uygulanır.
- Yapı, konteyner ve peyzaj kartındaki Taşı düğmesiyle arazide yeni merkez seçilir. Depo içeriği birlikte taşınır. Konum alanları da kullanılabilir.
- İşletme işlemleri yerel kayıtlardır. Fiziksel stok rezervasyonu, muhasebe, gerçek GPS, Kapsio API, oturumlu bulut kaydı veya çok kullanıcı yoktur.
- GitHub Actions kontrol dosyası hazırlanmıştır; etkin çalıştığı ayrıca doğrulanmalıdır.

## Birebirlik sınırı
Eski kaynaklar ve eski ekran görüntüleri bulunmadığından eski sürümün piksel/geometri düzeyinde aynılığı doğrulanamaz. Bu güncelleme konuşmada kaydı bulunan özellik farklarını kapatır; kayıp kodun aynen kurtarıldığı anlamına gelmez.
