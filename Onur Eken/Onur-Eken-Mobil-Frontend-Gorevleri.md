# Onur Eken - Mobil Frontend Gorevleri

Bu sayfa final teslimi icin Onur Eken'in mobil frontend sorumluluklarini takip etmek amaciyla hazirlanmistir.

## Atanan Ekranlar

### 1. Favori Takimlarim
- Ilgili backend: `GET /users/{id}/favorites`, `DELETE /users/{id}/favorites/{teamId}`
- Beklenenler:
- Favori takim kartlari
- Favoriden cikar aksiyonu
- Favori yoksa bos durum ekrani

### 2. Takim Arama
- Ilgili backend: `GET /teams/search`
- Beklenenler:
- Arama kutusu
- Yazdikca sonuc getiren liste
- Sonuc yoksa uyari mesaji

### 3. Gecmis Maclar
- Ilgili backend: `GET /matches/history`
- Beklenenler:
- Gecmis mac listesi
- Tarih veya takim bazli filtreleme
- Uzun liste icin pagination veya daha fazla goster

### 4. Mac Istatistikleri
- Ilgili backend: `GET /matches/{matchId}/stats`
- Beklenenler:
- Progress bar tabanli istatistik alani
- Animasyonlu veri dolumu
- Okunakli renkli gosterim

## Kanit Videosunda Gosterilecekler

- Once her gereksinim adi soylenmeli
- Uygulamanin emulator veya gercek cihazda calistigi gosterilmeli
- Arama, favori ve istatistik akislarinin calistigi kanitlanmali
- Videoda ogrencinin kendi sesi duyulmali

## Teslim Bilgileri

- Branch:
- Video linki:
- Durum: Bekliyor
