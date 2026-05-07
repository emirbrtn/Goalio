# Emircan Bartan - Mobil Frontend Gorevleri

Bu sayfa final teslimi icin Emircan Bartan'in mobil frontend sorumluluklarini takip etmek amaciyla hazirlanmistir.

## Atanan Ekranlar

### 1. Kayit Ol
- Ilgili backend: `POST /users/register`
- Beklenenler:
- Ad, soyad, email, sifre ve sifre tekrar alanlari
- Alan dogrulamalari
- Kayit ol butonu ve yukleniyor durumu
- Basarili kayit sonrasi giris ekranina yonlendirme

### 2. Profil Goruntuleme
- Ilgili backend: `GET /users/{id}`
- Beklenenler:
- Kullanici bilgilerini kart ya da liste yapisinda gosterme
- Varsayilan avatar
- Veriler gelene kadar loading/skeleton durumu

### 3. Profil Guncelleme
- Ilgili backend: `PUT /users/{id}`
- Beklenenler:
- Mevcut bilgilerle dolu form
- Kaydet ve iptal aksiyonlari
- Degisiklik yoksa kaydet butonunu pasif tutma
- Basarili guncelleme sonrasi ekrani yenilemeden UI'i guncelleme

## Kanit Videosunda Gosterilecekler

- Once "Kayit Ol", "Profil Goruntuleme" ve "Profil Guncelleme" gereksinim adlari soylenmeli
- Uygulamanin emulator veya gercek cihazda calistigi gosterilmeli
- Form dogrulamalari ve basarili akislar tek tek gosterilmeli
- Videoda ogrencinin kendi sesi duyulmali

## Teslim Bilgileri

- Branch:
- Video linki:
- Durum: Bekliyor
