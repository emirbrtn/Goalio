# Goalio Jenkins Notlari

Bu proje icin Jenkins pipeline dosyasi repo kokunde `Jenkinsfile` olarak eklendi.

Pipeline akisi:

1. Repo checkout
2. `backend/.env` olusturma
3. Eski container temizligi
4. `docker compose build`
5. `docker compose up -d`
6. Frontend ve backend smoke testleri
7. Log arsivleme ve cleanup

## Jenkins'te Gerekenler

- Docker kurulu ve calisiyor olmali
- Jenkins kullanicisinin Docker komutlarini calistirabiliyor olmasi gerekir
- Repo bir Pipeline project olarak eklenmeli
- Pipeline script from SCM secilip bu repodaki `Jenkinsfile` okunmali

## Opsiyonel Ortam Degiskenleri

Jenkins tarafinda istenirse su degiskenler tanimlanabilir:

- `JWT_SECRET`
- `SPORTSMONKS_API_TOKEN`
- `CLIENT_URL`
- `PORT`
- `MONGODB_URI`

Bu degiskenler verilmezse pipeline varsayilan degerlerle `backend/.env` dosyasini gecici olarak uretir.
