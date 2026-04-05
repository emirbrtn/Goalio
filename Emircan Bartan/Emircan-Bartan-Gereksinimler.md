**1.Kullanıcı Kaydı**
- **API Metodu:** `POST /users/register`
- **Açıklama:** Yeni bir kullanıcı hesabı oluşturulmasını sağlar.

**2.Kullanıcı Çıkışı**
- **API Metodu:** `POST /users/logout`
- **Açıklama:** Kullanıcının mevcut oturumunu sonlandırmasını sağlar.

**3.Profil Güncelleme**
- **API Metodu:** `PUT /users/{id}`
- **Açıklama:** Kullanıcının profil bilgilerinin güncellenmesini sağlar.

**4.Hesap Silme**
- **API Metodu:** `DELETE /users/{id}`
- **Açıklama:** Kullanıcının hesabının kalıcı olarak silinmesini sağlar.

**5.Profil Görüntüleme**
- **API Metodu:** `GET /users/{id}`
- **Açıklama:** Kullanıcının profil bilgilerinin görüntülenmesini sağlar.

**6.Maçları Listeleme**
- **API Metodu:** `GET /matches`
- **Açıklama:** Tüm maçların listelenmesini sağlar.

**7.Canlı Maçları Görüntüleme**
- **API Metodu:** `GET /matches/live`
- **Açıklama:** Canlı oynanan maçların listelenmesini sağlar.

**8.Maç Tahmini Görüntüleme**
- **API Metodu:** `GET /predictions/{matchId}`
- **Açıklama:** Belirli bir maç tahmininin görüntülenmesini sağlar.(Yapay Zeka)