# Mobil Back-End

Bu dokuman final tesliminde istenen mobil backend ve REST API baglanti gorevlerinin takibi icin hazirlanmistir.

## Final Icin Beklenenler

- Her grup uyesi kendisine atanan mobil backend gorevlerini yapmali.
- Bu kapsamda mobil uygulamadan REST API'ye istek gitmesi ve sonuc donmesi net sekilde gosterilmeli.
- Her uye kendi branch'ine push yapmali.
- Her uye kendine ait bir sayfa/bolum olusturup mobil backend kanit videosunu eklemeli.
- Video emulator veya gercek cihaz uzerinde alinmali.
- Videoda once gereksinim adi soylenmeli, sonra istek ve sonuc gosterilmeli.
- API isteginin gittigi ve islemin gerceklestigi acikca gorunmezse puan verilmeyecek.

## Is Akisi

1. Mobil uygulamada API baglantisi gerektiren ekranlari belirle.
2. Her ekrana karsi gelen endpoint'i eslestir.
3. Bu endpoint'leri ekip uyeleri arasinda paylastir.
4. Mobil uygulamadan backend'e giden istekleri calisir hale getir.
5. Basarili ve hatali durumlari test et.
6. Emulator veya cihaz uzerinde API istegi, gelen veri ve ekrana yansimasi videoya cekilsin.
7. Her uye kendi videosunu kendi sayfasina eklesin.

## Kontrol Listesi

- [ ] Mobil-API endpoint eslestirmesi yapildi
- [ ] Gorev dagilimi yapildi
- [ ] Her uye kendi branch'inde entegrasyonu tamamlandi
- [ ] API istekleri cihaz veya emulatorde test edildi
- [ ] Her uye backend kanit videosunu cekti
- [ ] Video linkleri repo icine eklendi

## Uye Bazli Kayitlar

### Emircan Bartan
- Atanan endpointler: `POST /users/register`, `GET /users/{id}`, `PUT /users/{id}`, `DELETE /users/{id}`, `POST /users/logout`
- Branch:
- Video linki:
- Durum:
- Detay sayfasi: [Emircan-Bartan-Mobil-Backend-Gorevleri.md](C:/Users/emirc/Desktop/Goalio/Emircan%20Bartan/Emircan-Bartan-Mobil-Backend-Gorevleri.md)

### Murat Kocgurbuz
- Atanan endpointler: `GET /matches`, `GET /matches/live`, `GET /predictions/{matchId}` ve bu akislarin mobil entegrasyonu
- Branch:
- Video linki:
- Durum:
- Detay sayfasi: [Murat-Kocgurbuz-Mobil-Backend-Gorevleri.md](C:/Users/emirc/Desktop/Goalio/Murat%20Ko%C3%A7g%C3%BCrb%C3%BCz/Murat-Kocgurbuz-Mobil-Backend-Gorevleri.md)

### Onur Eken
- Atanan endpointler: `POST /users/{id}/favorites`, `GET /users/{id}/favorites`, `DELETE /users/{id}/favorites/{teamId}`, `GET /matches/history`, `GET /matches/{matchId}/stats`, `GET /teams/search`
- Branch:
- Video linki:
- Durum:
- Detay sayfasi: [Onur-Eken-Mobil-Backend-Gorevleri.md](C:/Users/emirc/Desktop/Goalio/Onur%20Eken/Onur-Eken-Mobil-Backend-Gorevleri.md)

## Gorev Dagilimi Ozeti

- Emircan Bartan: Kullanici hesabi ve profil endpointleri
- Murat Kocgurbuz: Ana mac akislari ve AI tahmin endpointleri
- Onur Eken: Favoriler, arama, gecmis maclar ve istatistik endpointleri
