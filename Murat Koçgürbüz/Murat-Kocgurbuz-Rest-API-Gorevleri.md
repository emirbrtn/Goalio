# Murat Koçgürbüz'ün REST API Metotları

**API Test Videosu:** [YouTube Linki](https://youtu.be/qv35fMvwoac)

### 1. Kullanıcı Girişi (Login)

**Endpoint:** `POST /api/users/login`

**Request Body:**
{
  "email": "kmk@goalio.com",
  "password": "YeniSifre123"
}

**Response:** `200 OK` - Kullanıcı girişi başarılı ve Token oluşturuldu.


### 2. Şifre Değiştirme

**Endpoint:** `PUT /api/users/{userId}/password`

**Request Body:**
{
    "currentPassword": "YeniSifre123", 
    "newPassword": "yenisifre"
}
**Response:** `200 No Content`

**Path Parameters:**
* `userId` (string, required) - Kullanıcı ID'si

**Request Body:**
{
  "currentPassword": "eskiSifre123",
  "newPassword": "yeniSifre123"
}

**Authentication:** Bearer Token gerekli
**Response:** `204 No Content` - Şifre başarıyla güncellendi.


### 3. Lig Genel Görünümünü Listeleme

**Endpoint:** `GET /api/teams/league-overview/{leagueKey}`

**Path Parameters:**
* `leagueKey` (string, required) - Lig anahtarı (Örn: turkey)

**Response:** `200 OK` - Lig puan durumu ve genel bilgileri başarıyla getirildi.


### 4. Lig Bazlı Maç Listeleme (Fikstür)

**Endpoint:** `GET /api/matches?league={leagueId}`

**Query Parameters:**
* `league` (number, required) - Lig ID'si (Örn: 600)

**Response:** `200 OK` - Lige ait fikstür ve maç listesi başarıyla getirildi.


### 5. Maç Detayı Görüntüleme

**Endpoint:** `GET /api/matches/{matchId}`

**Path Parameters:**
* `matchId` (string, required) - Maç ID'si

**Response:** `200 OK` - Maç detayları, kadrolar ve canlı istatistikler getirildi.


### 6. Takım Bilgisi Görüntüleme

**Endpoint:** `GET /api/teams/{teamId}`

**Path Parameters:**
* `teamId` (string, required) - Takım ID'si

**Response:** `200 OK` - Takım kadrosu ve kulüp bilgileri başarıyla getirildi.


### 7. Favori Takım Silme

**Endpoint:** `DELETE /api/users/{userId}/favorites/{teamId}`

**Path Parameters:**
* `userId` (string, required) - Kullanıcı ID'si
* `teamId` (string, required) - Takım ID'si

**Authentication:** Bearer Token gerekli
**Response:** `204 No Content` - Takım favori listesinden başarıyla silindi.


### 8. Tahmin Oluşturma (AI Prediction)

**Endpoint:** `POST /api/predictions/generate`

**Request Body:**
{
  "matchId": "19443177"
}

**Authentication:** Bearer Token gerekli
**Response:** `201 Created` - Yapay zeka skor tahmini başarıyla oluşturuldu.