**1.Kullanıcı Girişi**
- **API Metodu:** `POST /users/login`
- **Açıklama:** Kullanıcının hesap bilgileriyle uygulamaya giriş yapmasını sağlar.

**2.Şifre Değiştirme**
- **API Metodu:** `PUT /users/{id}/password`
- **Açıklama:**  Kullanıcının şifresini değiştirmesini sağlar.

**3.Maç Skoru Güncelleme**
- **API Metodu:** `PUT /matches/{matchld}/score`
- **Açıklama:**  Yetkili kullanıcı tarafından skor güncellemesini sağlar.

**4.Lig Bazlı Maç Listeleme**
- **API Metodu:** `GET /matches?league={leagueld}`
- **Açıklama:**  Belirli bir lige ait maçların görüntülenmesini sağlar.

**5.Maç Detayı Görüntüleme**
- **API Metodu:** `GET /matches/{matchld}`
- **Açıklama:**  Seçilen maçın detay bilgilerinin görüntülenmesini sağlar.

**6.Takım Bilgisi Görüntüleme**
- **API Metodu:** `GET /teams/{teamld}`
- **Açıklama:**  Takım bilgilerinin görüntülenmesini sağlar.

**7.Favori Takım Silme**
- **API Metodu:** `DELETE /users/{id}/favorites/{teamId}`
- **Açıklama:**  Kullanıcının favori takımlarından birini silmesini sağlar.

**8.Tahmin Oluşturma**
- **API Metodu:** `POST /predictions/generate`
- **Açıklama:**  Yapay zekâ tarafından maç tahmini oluşturulmasını sağlar.(Yapay Zekâ)
