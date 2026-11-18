# Kapsio sevkiyat bağlantısı — adaptör sözleşmesi
Bu belge mevcut Kapsio API'sini tanımlamaz. Kapsio tarafında aşağıdaki sözleşmeyi kabul eden bir uç nokta veya uyarlayıcı gerekir. Erişim URL'si, test anahtarı ve gerçek yanıt biçimi henüz sağlanmadığı için canlı bağlantı doğrulanmadı.

Harita → Kapsio API ekranından tam HTTPS POST URL'si ve Bearer anahtarı oturum belleğine alınır. Yerel depoya, Git'e veya JSON yedeğine anahtar yazılmaz. Harita → Kapsio'ya gönder, seçili sevkiyatı kullanıcı onayıyla yollar.
POST başlıkları: Content-Type application/json, Authorization Bearer <token>, Idempotency-Key <yerel-sevkiyat-id>.
Payload: dist/shipment-api.js içindeki shipmentPayload, schema = project-world.shipment.v1. Konum, sevkiyat, plaka, atanmış sürücü, yük, kalkış ve tahmini varış içerir.
Başarılı yanıt: HTTP 2xx ve JSON {"id":"kalıcı-kapsio-sevkiyat-kimliği"}.
Aynı Idempotency-Key tekrar geldiğinde alıcı aynı kaydı döndürmelidir; tekrar oluşturmamalıdır.
Kapsio kimliği gelmeden arayüz gönderildi demez. Hata veya zaman aşımında yerel kayıt korunur. Yeniden göndermeden önce Kapsio kaydı kontrol edilmelidir.
Kapsio CORS ayarında yalnız Project World yayın origin'i kabul edilmeli, POST/OPTIONS ve gerekli başlıklar desteklenmelidir.
Sunucuda kiracı/şirket ve yetki kontrolü yapılmalıdır. Bu çalışma Kapsio sunucusuna alıcı endpoint kurmaz.
Mevcut API farklıysa bu adaptör gerçek dokümana göre uyarlanmalıdır. Onay sonrası düzenlemeleri API'ye PATCH ile eşitleme bu sürümde yoktur.
