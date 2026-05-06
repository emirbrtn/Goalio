# Onur Eken - Mobil Backend Gorevleri

Bu sayfa final teslimi icin Onur Eken'in mobil backend entegrasyon sorumluluklarini takip etmek amaciyla hazirlanmistir.

## Atanan Endpointler

### 1. Favori Takim Ekleme
- Endpoint: `POST /users/{id}/favorites`
- Mobil kanit:
- Takim ekleme isteginin gittigi
- Sonucun favori listesine yansidigi

### 2. Favori Takimlari Listeleme
- Endpoint: `GET /users/{id}/favorites`
- Mobil kanit:
- Favori takim verilerinin cekildigi
- Liste ekraninda gosterildigi

### 3. Favori Takim Silme
- Endpoint: `DELETE /users/{id}/favorites/{teamId}`
- Mobil kanit:
- Silme isteginin gittigi
- Listenin aninda guncellendigi

### 4. Gecmis Maclari Listeleme
- Endpoint: `GET /matches/history`
- Mobil kanit:
- Gecmis maclar isteginin gittigi
- Donen verinin filtreli veya listeli sekilde gosterildigi

### 5. Mac Istatistiklerini Goruntuleme
- Endpoint: `GET /matches/{matchId}/stats`
- Mobil kanit:
- Secilen maca ait istatistik isteginin gittigi
- Verinin grafiksel olarak gosterildigi

### 6. Takim Arama
- Endpoint: `GET /teams/search`
- Mobil kanit:
- Arama sorgusunun API'ye gittigi
- Sonuclarin anlik olarak listelendigi

## Kanit Videosunda Gosterilecekler

- Her endpoint icin once gereksinim adi soylenmeli
- Mobil uygulamadan API isteginin gittigi net sekilde gosterilmeli
- Donen verinin ekrana islendigi gorulmeli
- Videoda ogrencinin kendi sesi duyulmali

## Teslim Bilgileri

- Branch:
- Video linki:
- Durum: Bekliyor
