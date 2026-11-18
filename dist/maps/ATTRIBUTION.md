# Türkiye il sınırları
Bu dosyadaki provinces.json: https://github.com/theaiagent/turkiye_iller_geojson/blob/main/turkiye_iller.geojson
Geometri kaynağı: OpenStreetMap katkıcıları ve https://github.com/cihadturhan/tr-geojson
Plaka, Türkçe il adı ve bölge standardizasyonu: theaiagent/turkiye_iller_geojson.
Lisans: Open Database License (ODbL) v1.0 — https://opendatacommons.org/licenses/odbl/1-0/
Veri aynı ODbL lisansıyla bu uygulama içinde provinces.json olarak dağıtılır.
İl sınırları genel görselleştirme içindir; resmi kadastro veya idari doğrulama değildir.
Rotalar: OSRM / OpenStreetMap katkıcıları (ODbL).

## Ana yol ağı
Natural Earth ne_10m_roads (public domain):
https://www.naturalearthdata.com/downloads/10m-cultural-vectors/roads/
https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_10m_roads.geojson
Türkiye çevresindeki Major Highway ve Secondary Highway çizgileri alınmış, koordinatlar yuvarlanmış ve çizgiler .006 derece toleransla genelleştirilmiştir.
Çizgiler haritada il poligonlarıyla kırpılır. Veri güncel navigasyon / yeni otoyol envanteri değildir.

## Güncel görünür yol haritası
Natural Earth roads.json önceki sürüm varlığı olarak kalır; uygulama artık bu dosyayı yüklemez.
Yayındaki yol katmanı https://tile.openstreetmap.org/{z}/{x}/{y}.png üzerinden görünür alan için yüklenir.
© OpenStreetMap contributors — https://www.openstreetmap.org/copyright
Kullanım politikası: https://operations.osmfoundation.org/policies/tiles/
Toplu indirme veya çevrimdışı harita paketi sunulmaz; normal tarayıcı önbelleği kullanılır.
