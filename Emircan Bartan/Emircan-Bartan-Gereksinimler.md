**Kullanıcı Kaydı**
- **API Metodu:** `POST /users/register`
- **Açıklama:** Yeni bir kullanıcı hesabı oluşturulmasını sağlar.

**Kullanıcı Çıkışı**
- **API Metodu:** `POST /users/logout`
- **Açıklama:** Kullanıcının mevcut oturumunu sonlandırmasını sağlar.

**Profil Güncelleme**
- **API Metodu:** `PUT /users/{id}`
- **Açıklama:** Kullanıcının profil bilgilerinin güncellenmesini sağlar.

**Hesap Silme**
- **API Metodu:** `DELETE /users/{id}`
- **Açıklama:** Kullanıcının hesabının kalıcı olarak silinmesini sağlar.

**Profil Görüntüleme**
- **API Metodu:** `GET /users/{id}`
- **Açıklama:** Kullanıcının profil bilgilerinin görüntülenmesini sağlar.

**Maçları Listeleme**
- **API Metodu:** `GET /matches`
- **Açıklama:** Tüm maçların listelenmesini sağlar.

**Canlı Maçları Görüntüleme**
- **API Metodu:** `GET /matches/live`
- **Açıklama:** Canlı oynanan maçların listelenmesini sağlar.

**Maç Tahmini Görüntüleme**
- **API Metodu:** `GET /predictions/{matchId}`
- **Açıklama:** Belirli bir maç tahmininin görüntülenmesini sağlar.(Yapay Zeka)