# Goalio Docker Kurulumu

Bu proje Docker Compose ile uc servis halinde calisir:

- `frontend`: Next.js uygulamasi
- `backend`: Express API
- `mongodb`: MongoDB veritabani

## Hazirlik

1. `backend/.env.example` dosyasini `backend/.env` olarak kopyalayin.
2. En az su alanlari doldurun:
   - `JWT_SECRET`
   - `SPORTSMONKS_API_TOKEN`

## Calistirma

```bash
docker compose up --build
```

## Erisim Adresleri

- Frontend: `http://localhost:3000`
- Backend: `http://localhost:5000`
- MongoDB: `mongodb://localhost:27017/goalio`

## Teknik Not

Frontend, Docker icinde `/api` isteklerini otomatik olarak backend servisine proxy eder. Bu nedenle tarayici tarafinda ayrica `http://localhost:5000` ayari yapmaniz gerekmez.
