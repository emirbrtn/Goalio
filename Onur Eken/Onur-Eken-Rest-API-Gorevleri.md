# Onur Eken'in REST API Metotlari

**API Test Videosu:** [YouTube Linki](https://youtu.be/nie0vCso7f8)

---

## 1. Favori Takim Ekleme

**Endpoint:** `POST /users/{id}/favorites`

**Path Parameters:**
- `id` `(string, required)` - Kullanici ID'si

**Request Body:**
```json
{
  "teamId": "34"
}
```

**Authentication:** Bearer Token gerekli  
**Response:** `200 OK` - Favori takim basariyla eklendi

---

## 2. Kullanici Tahmini Kaydetme

**Endpoint:** `POST /users/{id}/predictions`

**Path Parameters:**
- `id` `(string, required)` - Kullanici ID'si

**Request Body:**
```json
{
  "matchId": "19443174",
  "predictedResult": "homeWin"
}
```

**Authentication:** Bearer Token gerekli  
**Response:** `201 Created` - Kullanici tahmini basariyla kaydedildi

---

## 3. Bildirim Tercihlerini Guncelleme

**Endpoint:** `PUT /users/{id}/notifications`

**Path Parameters:**
- `id` `(string, required)` - Kullanici ID'si

**Request Body:**
```json
{
  "predictionResolved": true,
  "favoriteMatchStart": true,
  "favoriteMatchResult": false
}
```

**Authentication:** Bearer Token gerekli  
**Response:** `200 OK` - Bildirim tercihleri basariyla guncellendi

---

## 4. Favori Takimlari Listeleme

**Endpoint:** `GET /users/{id}/favorites`

**Path Parameters:**
- `id` `(string, required)` - Kullanici ID'si

**Authentication:** Bearer Token gerekli  
**Response:** `200 OK` - Kullanicinin favori takimlari basariyla getirildi

---

## 5. Mac Istatistiklerini Goruntuleme

**Endpoint:** `GET /matches/{matchId}/stats`

**Path Parameters:**
- `matchId` `(string, required)` - Mac ID'si

**Authentication:** Gerekmiyor  
**Response:** `200 OK` - Mac istatistikleri basariyla getirildi

---

## 6. Gecmis Maclari Listeleme

**Endpoint:** `GET /matches/history`

**Authentication:** Gerekmiyor  
**Response:** `200 OK` - Gecmis maclar basariyla getirildi

---

## 7. Takim Arama

**Endpoint:** `GET /teams/search?q={keyword}`

**Query Parameters:**
- `keyword` `(string, required)` - Aranacak takim anahtar kelimesi

**Authentication:** Gerekmiyor  
**Response:** `200 OK` - Takim arama sonuclari basariyla getirildi

---

## 8. Tahmin Silme

**Endpoint:** `DELETE /users/{id}/predictions/{predictionId}`

**Path Parameters:**
- `id` `(string, required)` - Kullanici ID'si
- `predictionId` `(string, required)` - Silinecek tahmin ID'si

**Authentication:** Bearer Token gerekli  
**Response:** `200 OK` - Kullanici tahmini basariyla silindi

---

## 9. Oyuncu Arama

**Endpoint:** `GET /players/search?q={keyword}`

**Query Parameters:**
- `keyword` `(string, required)` - Aranacak oyuncu anahtar kelimesi

**Authentication:** Gerekmiyor  
**Response:** `200 OK` - Oyuncu arama sonuclari basariyla getirildi
