# GOALIO REST API DOKÜMANTASYONU

API Test Videosu: [Video İzle](https://youtu.be/YAvlya2N4KE)

---

## 1. KULLANICI KAYDI
- Endpoint: POST /api/users/register
- Request Body:
  {
    "username": "emircan_goalio",
    "email": "emircan11@test.com",
    "password": "sifre123"
  }
- Response: 201 Created - Kullanıcı başarıyla oluşturuldu.

## 2. PROFİL GÖRÜNTÜLEME
- Endpoint: GET /api/users/{id}
- Authentication: Bearer Token gerekli.
- Response: 200 OK - Kullanıcı bilgileri başarıyla getirildi.

## 3. PROFİL GÜNCELLEME
- Endpoint: PUT /api/users/{id}
- Request Body:
  {
    "username": "emircan_updated",
    "avatarId": "striker"
  }
- Authentication: Bearer Token gerekli.
- Response: 200 OK - Kullanıcı başarıyla güncellendi.

## 4. MAÇLARI LİSTELEME
- Endpoint: GET /api/matches
- Response: 200 OK - Tüm maçların listesi başarıyla getirildi.

## 5. CANLI MAÇLARI GÖRÜNTÜLEME
- Endpoint: GET /api/matches/live
- Response: 200 OK - Canlı oynanan maçlar listelendi.

## 6. MAÇ TAHMİNİ GÖRÜNTÜLEME
- Endpoint: GET /api/predictions/{matchId}
- Response: 200 OK - Yapay zeka skor tahmini başarıyla getirildi.

## 7. KULLANICI ÇIKIŞI
- Endpoint: POST /api/users/logout
- Response: 200 OK - Kullanıcı oturumu başarıyla sonlandırıldı.

## 8. HESAP SİLME
- Endpoint: DELETE /api/users/{id}
- Authentication: Bearer Token gerekli.
- Response: 200 OK - Kullanıcı hesabı sistemden kalıcı olarak silindi.