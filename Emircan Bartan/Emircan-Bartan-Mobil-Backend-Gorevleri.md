# Emircan Bartan - Mobil Backend Gorevleri

Bu sayfa final teslimi icin Emircan Bartan'in mobil backend entegrasyon sorumluluklarini takip etmek amaciyla hazirlanmistir.

## Atanan Endpointler

### 1. Kullanici Kaydi
- Endpoint: `POST /users/register`
- Mobil kanit:
- Formdan gelen verinin API'ye gittigi
- Basarili veya hatali donusun ekrana yansidigi

### 2. Profil Goruntuleme
- Endpoint: `GET /users/{id}`
- Mobil kanit:
- Giris yapan kullaniciya ait verinin cekildigi
- Verinin profil ekraninda gosterildigi

### 3. Profil Guncelleme
- Endpoint: `PUT /users/{id}`
- Mobil kanit:
- Guncelleme isteginin gonderildigi
- Donen sonucun ekranda goruldugu

### 4. Hesap Silme
- Endpoint: `DELETE /users/{id}`
- Mobil kanit:
- Onay akisi
- Silme isteginin gittigi ve kullanicinin cikis yaptigi

### 5. Cikis Yapma
- Endpoint: `POST /users/logout`
- Mobil kanit:
- Cikis isteginin gonderildigi
- Token veya oturum bilgisinin temizlendigi

## Kanit Videosunda Gosterilecekler

- Her endpoint icin once gereksinim adi soylenmeli
- Mobil uygulamadan API isteginin gittigi net sekilde gosterilmeli
- Donen basarili veya hatali sonuc acikca gorunmeli
- Videoda ogrencinin kendi sesi duyulmali

## Teslim Bilgileri

- Branch:
- Video linki:
- Durum: Bekliyor
