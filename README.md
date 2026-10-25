# Project World 1.0 — yeniden kurulum
İzometrik 3D işletme ve şantiye prototipi. Bu depo uygulamanın bağımsız ana kaynak deposudur; Sites yalnızca yayın katmanıdır.

## Çalıştırma
Node.js 20+ gerekir:
```sh
npm ci
npm run dev
```
http://localhost:5173 adresini aç. HTML dosyasını doğrudan dosya sisteminden açma. Çalışırken CDN kullanılmaz; sabit Three.js 0.170.0 bağımlılığı build sırasında dist/vendor içine kopyalanır.

## Kontroller
```sh
npm run build
npm run check
npm test
```

## Kayıt
Kaydet ve otomatik kayıt yalnızca bu tarayıcıda veri tutar. Dosya > JSON indir, saha kayıtlarının taşınabilir yedeğidir. GitHub kaynak kodunu korur; kişisel saha kayıtlarını içermez.

## Kapsam
Ürün kararları docs/KAPSAM.md içinde tutulur. İlk uygulama dosyaları kurtarılamadığı için bu sürüm yeniden geliştirilmiştir. Ayrıntılı uygulama durumu docs/DURUM.md içinde verilir.

## Kurtarma
1. GitHub > Code > Download ZIP veya git clone ile bu depoyu al.
2. npm ci ve npm run dev çalıştır.
3. Kendi saha yedeğini JSON içe aktar ile aç.
4. Sites kaydı silinse bile bu depo bağımsız olarak kalır. GitHub hesabından depoyu silmek bu korumayı kaldırır.

## Entegrasyon sınırı
Konum ve rotalar örnek veridir. Gerçek GPS, Kapsio, sunucu hesabı veya çok kullanıcılı veri senkronizasyonu henüz bağlı değildir. Takvim ve malzeme hesabı planlama senaryosudur.
