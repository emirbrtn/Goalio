**Favori Takım Ekleme**
- **API Metodu:** `POST /users/{id}/favorites`
- **Açıklama:** : Kullanıcının favori takım eklemesini sağlar.

**Kullanıcı Tahmini Kaydetme**
- **API Metodu:** `POST /users/{id}/predictions`
- **Açıklama:** : Kullanıcının kendi tahminini kaydetmesini sağlar.

**Bildirim Tercihlerini Güncelleme**
- **API Metodu:** `PUT /users/{id}/notifications`
- **Açıklama:** : Kullanıcının bildirim ayarlarını değiştirmesini sağlar.

**Favori Takımları Listeleme**
- **API Metodu:** `GET /users/{id}/favorites`
- **Açıklama:** : Kullanıcının favori takımlarını görüntülemesini sağlar.

**Maç İstatistiklerini Görüntüleme**
- **API Metodu:** `GET /matches/{matchld}/stats`
- **Açıklama:** : Belirtilen bir maçın istatistiklerini görüntülemesini sağlar.

**Geçmiş Maçları Listeleme**
- **API Metodu:** `GET /matches/history`
- **Açıklama:** : Kullanıcının geçmiş maçları görüntülemesini sağlar.

**Maç Arama**
- **API Metodu:** `GET /matches/search?q={keyword}`
- **Açıklama:** : Maçlar arasında arama yapılmasını sağlar.

**Tahmin Silme**
- **API Metodu:** `DELETE /users/{id}/predictions/{predictionId}`
- **Açıklama:** : Kullanıcının tahminini silmesini sağlar. (Yapay Zekâ)
