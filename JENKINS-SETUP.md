# Goalio Jenkins Kurulumu

Bu dosya, ders slaytlarindaki Jenkins + Docker + webhook akisini `Goalio` icin uygulamak icindir.

## 1. Jenkins'i Docker ile baslat

Proje kok dizininde:

```bash
docker compose -f docker-compose.jenkins.yml up -d --build
```

Jenkins arayuzu:

- `http://localhost:8080`

## 2. Jenkins container icinde Docker kontrolu

Asagidaki komutlar slayttaki Docker CLI kontrolune karsilik gelir:

```bash
docker exec goalio-jenkins docker --version
docker exec goalio-jenkins docker compose version
```

## 3. Jenkins'te pipeline olustur

Jenkins icinde:

1. `New Item`
2. Item adi: `goalio`
3. `Pipeline`
4. `Pipeline script from SCM`
5. SCM: `Git`
6. Repository URL: `https://github.com/emirbrtn/Goalio.git`
7. Script Path: `Jenkinsfile`

## 4. GitHub webhook bagla

GitHub repo ayarlari:

1. `Settings`
2. `Webhooks`
3. `Add webhook`
4. Payload URL olarak Jenkins webhook adresini ver

Standart Jenkins webhook ucu:

```text
http://<jenkins-adresi>/github-webhook/
```

Lokal Jenkins disaridan erisilemeyecekse bir tunnel kullanman gerekir.

## 5. Cloudflare Tunnel ile Jenkins'i disari ac

Slayttaki ekran buna isaret ediyor. En kolay yol:

```bash
cloudflared tunnel --url http://localhost:8080
```

Bundan sonra sana su tipte bir adres verir:

```text
https://random-name.trycloudflare.com
```

Webhook URL bu olur:

```text
https://random-name.trycloudflare.com/github-webhook/
```

## 6. Pipeline'da beklenen asamalar

Repo icindeki `Jenkinsfile` su asamalari gosterir:

1. `Checkout SCM`
2. `Checkout`
3. `Build and Deploy`
4. `Health Check`
5. `Post Actions`

Bu isimler slayttaki pipeline goruntusune yaklastirilmistir.

## 7. Video icin gosterilecekler

Videoda sunlari goster:

1. Jenkins container calisiyor
2. `docker --version` ve `docker compose version`
3. Jenkins pipeline konfigurasyonu
4. GitHub webhook ayari
5. GitHub'a push
6. Jenkins'in otomatik tetiklenmesi
7. Basarili pipeline ekranı
8. Docker Desktop'ta `frontend`, `backend`, `mongodb`
9. `http://localhost:3000` frontend
10. `http://localhost:5000` backend cevabi
