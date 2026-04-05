# Goalio - Frontend ve API Entegrasyon Gereksinimleri

Bu doküman, Goalio projesinin kullanıcı arayüzü (UI) bileşenleri, kullanıcı deneyimi (UX) akışları ve API entegrasyon süreçlerini takip etmek amacıyla oluşturulmuştur.

## 1. Kullanıcı Kaydı (Register) Sayfası
**API Endpoint:** `POST /users/register`  
**Görev:** Yeni bir kullanıcı hesabı oluşturulması için arayüz tasarımı ve API entegrasyonu.

### Yapılacaklar:
- [ ] Ad, Soyad, Email, Şifre ve Şifre Tekrar inputlarının tasarlanması.
- [ ] "Kayıt Ol" butonu (Primary) ve "Zaten hesabın var mı? Giriş yap" yönlendirme linkinin eklenmesi.
- [ ] İşlem sırasında butonda "loading" animasyonunun gösterilmesi.
- [ ] Şifrelerin birbiriyle eşleştiğinin anlık (real-time) kontrol edilmesi.
- [ ] Minimum şifre uzunluğu ve zorunlu alan uyarılarının eklenmesi.
- [ ] Kayıt başarılı olduğunda kullanıcının Login sayfasına yönlendirilmesi ve başarı mesajı (Toast) gösterilmesi.
- [ ] Email zaten kayıtlıysa ilgili inputun altında hata mesajı gösterilmesi.

---

## 2. Kullanıcı Çıkışı (Logout) Akışı
**API Endpoint:** `POST /users/logout`  
**Görev:** Aktif kullanıcının oturumunu güvenli bir şekilde sonlandırması.

### Yapılacaklar:
- [ ] Header veya Sidebar'a "Çıkış Yap" butonu/ikonu eklenmesi.
- [ ] Yanlışlıkla tıklamalara karşı "Çıkış yapmak istediğinize emin misiniz?" pop-up'ı (Modal) hazırlanması.
- [ ] Onay sonrası bekletmeden ana sayfaya (veya giriş sayfasına) yönlendirme yapılması.
- [ ] `localStorage` veya `sessionStorage` içindeki JWT Token ve kullanıcı bilgilerinin temizlenmesi.
- [ ] Global kullanıcı state'inin (Context/Redux) sıfırlanması.

---

## 3. Profil Güncelleme Sayfası
**API Endpoint:** `PUT /users/{id}`  
**Görev:** Kullanıcının ad, soyad gibi kişisel bilgilerini değiştirebildiği form yapısı.

### Yapılacaklar:
- [ ] Mevcut kullanıcı bilgileriyle dolu olarak gelen input alanlarının oluşturulması.
- [ ] "Değişiklikleri Kaydet" ve "İptal" butonlarının eklenmesi.
- [ ] Değişiklik yapılmadığında "Kaydet" butonunun inaktif (disabled) yapılması.
- [ ] Güncelleme sonrası sayfa yenilenmeden verilerin güncellenmesi (Optimistic UI) ve başarı mesajı gösterilmesi.

---

## 4. Hesap Silme (Delete Account) Akışı
**API Endpoint:** `DELETE /users/{id}`  
**Görev:** Kullanıcının hesabını kalıcı olarak silmesi için güvenli ve uyarıcı bir arayüz.

### Yapılacaklar:
- [ ] Profil ayarları sayfasının altına kırmızı renkli "Hesabımı Sil" butonu (Danger zone) eklenmesi.
- [ ] Tıklandığında açılan, güçlü görsel uyarılara sahip (kalın yazılar, ikonlar) onay Modalı (Dialog) tasarlanması.
- [ ] Silme onayından önce ekstra güvenlik için kullanıcıdan şifresinin istenmesi.
- [ ] İşlem sonrası oturumun kapatılıp ana sayfaya yönlendirilmesi.

---

## 5. Profil Görüntüleme Paneli
**API Endpoint:** `GET /users/{id}`  
**Görev:** Kullanıcının kendi bilgilerini (veya diğer kullanıcıların açık bilgilerini) görebileceği özet ekran.

### Yapılacaklar:
- [ ] Profil fotoğrafı alanı (varsayılan avatar/icon) eklenmesi.
- [ ] İsim, Soyisim, Kayıt tarihi gibi bilgilerin okunaklı şekilde listelenmesi.
- [ ] Veriler yüklenene kadar Skeleton Loading ekranı gösterilmesi.
- [ ] Kullanıcı kendi profilindeyse "Profili Düzenle" butonunun gösterilmesi.

---

## 6. Genel Maçları Listeleme (Fikstür)
**API Endpoint:** `GET /matches`  
**Görev:** Platformdaki tüm maçların listelendiği ana akış sayfası.

### Yapılacaklar:
- [ ] Tarih filtreleme alanı (Bugün, Yarın, Geçmiş Maçlar vs.) oluşturulması.
- [ ] Liste veya grid şeklinde maç kartlarının tasarlanması.
- [ ] Sayfalama (Pagination) veya Infinite Scroll yapısının kurulması.
- [ ] Geçmiş maçların skorlarının, gelecek maçların ise saatlerinin vurgulanması.

---

## 7. Canlı Maçları Görüntüleme Ekranı
**API Endpoint:** `GET /matches/live`  
**Görev:** Sadece o an oynanmakta olan maçların listelendiği dinamik arayüz.

### Yapılacaklar:
- [ ] Yanıp sönen kırmızı bir "Canlı" (Live) ibaresi (Badge/Indicator) eklenmesi.
- [ ] O anki skor ve maçın dakikasının gösterilmesi.
- [ ] Arka planda belirli aralıklarla (Polling) veya anlık olarak (WebSocket) skor/dakika güncellemesi yapılması.
- [ ] Gol olduğunda skorun renginin anlık değişmesi veya animasyon (Highlight) eklenmesi.

---

## 8. Maç Tahmini Görüntüleme (AI Prediction)
**API Endpoint:** `GET /predictions/{matchId}`  
**Görev:** AI tahmin oluşturma sisteminin sonucunu getiren ve detaylıca gösteren sayfa.

### Yapılacaklar:
- [ ] Kazanma olasılıklarını gösteren barlar (Progress bar) eklenmesi (Örn: %60 Ev Sahibi, %20 Beraberlik, %20 Deplasman).
- [ ] Yapay zekanın beklenen skor tahmininin gösterilmesi.
- [ ] Tahminin nedenini açıklayan AI analiz metni alanının oluşturulması.
- [ ] Goalio temasına uygun, fütüristik yapay zeka vurgulu bir tasarım dilinin uygulanması.
- [ ] Tahmin yoksa "Tahmin henüz hazır değil" mesajı ve "Şimdi Oluştur" butonu gösterilmesi.