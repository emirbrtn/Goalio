**Front-end Test Videosu:** [YouTube Linki](https://youtu.be/7BV3eC8jqsE)

## 1. Kullanıcı Girişi Sayfası (Login)
* **API Endpoint:** `POST /users/login`
* **Görev:** Kullanıcının hesap bilgileriyle uygulamaya güvenli giriş yapmasını sağlayan sayfanın tasarımı ve implementasyonu.

**UI Bileşenleri:**
* Responsive giriş formu (Center card layout).
* Email input alanı (`type="email"`).
* Şifre input alanı (`type="password"`, göz ikonu ile şifreyi göster/gizle özelliği).
* "Giriş Yap" butonu (Goalio ana tema renginde).
* "Şifremi Unuttum" ve "Hesabın yok mu? Kayıt Ol" yönlendirme linkleri.
* İşlem sırasında Loading spinner.

**Form Validasyonu:**
* Email format kontrolü (regex pattern).
* Boş alan kontrolü (Client-side validation).

**Kullanıcı Deneyimi:**
* Hatalı girişlerde (Yanlış şifre/kullanıcı yok) input altında veya üst kısımda kırmızı uyarı mesajı (Toast notification).
* Başarılı giriş sonrası Goalio ana sayfasına (veya dashboard'a) pürüzsüz yönlendirme.
* Enter tuşu ile form submit desteği (Keyboard navigation).

**Teknik Detaylar:**
* Form state yönetimi (React state veya React Hook Form).
* Başarılı giriş sonrası dönen JWT token'ın güvenli bir şekilde saklanması (`localStorage` veya `sessionStorage`).
* Giriş yapmış kullanıcının state'inin global olarak güncellenmesi (Context API veya Redux).

---

## 2. Şifre Değiştirme Akışı
* **API Endpoint:** `PUT /users/{id}/password`
* **Görev:** Kullanıcının profil veya ayarlar sayfası üzerinden mevcut şifresini güvenli bir şekilde değiştirmesi.

**UI Bileşenleri:**
* Profil/Ayarlar sayfasında "Güvenlik" veya "Şifre Değiştir" sekmesi.
* Mevcut şifre input alanı.
* Yeni şifre input alanı.
* Yeni şifre tekrar input alanı.
* "Şifreyi Güncelle" butonu.

**Form Validasyonu:**
* Yeni şifre güvenlik kuralları (min 8 karakter, harf/rakam zorunluluğu).
* Yeni şifre ile şifre tekrar alanının eşleşme kontrolü (Real-time).

**Kullanıcı Deneyimi:**
* Şifreler eşleşmiyorsa butonun disabled kalması.
* Başarılı değişim sonrası yeşil başarı mesajı (Snackbar/Toast) ve formun temizlenmesi.

**Teknik Detaylar:**
* API isteği sırasında güvenlik amacıyla Authorization header (Bearer Token) gönderimi.
* Tailwind CSS ile form elemanlarının Focus ve Error state tasarımları.

---

## 3. Lig Genel Görünüm Paneli (League Overview)
* **API Endpoint:** `GET /teams/league-overview/{leagueKey}`
* **Görev:** Seçilen ligin (örn: Süper Lig, Premier League) genel istatistiklerinin ve öne çıkan takımlarının sergilendiği dashboard tasarımı.

**UI Bileşenleri:**
* Lig logosu ve başlığı (Hero section).
* Puan durumu (Standings) tablosu (Sıra, Takım, O, G, B, M, P).
* Gol krallığı veya öne çıkan istatistikler için mini kartlar.

**Kullanıcı Deneyimi:**
* Veriler yüklenirken tablo yapısına uygun Skeleton Loading ekranı.
* Tabloda takım isimlerine tıklandığında Takım Bilgisi sayfasına yönlendirme.
* Mobil görünümlerde tablonun yatay kaydırılabilir (horizontal scroll) olması.

**Teknik Detaylar:**
* Sayfa yüklendiğinde `useEffect` ile verilerin fetch edilmesi.
* Karmaşık verilerin tablo komponentlerine map edilmesi.
* Resim optimizasyonu (Takım logoları için lazy loading).

---

## 4. Lig Bazlı Maç Listeleme (Fikstür)
* **API Endpoint:** `GET /matches?league={leagueld}`
* **Görev:** Belirli bir lige ait oynanmış veya oynanacak maçların liste halinde sunulması.

**UI Bileşenleri:**
* Hafta/Tarih seçici (Dropdown veya Datepicker).
* Maç kartları (Ev Sahibi Takım Logosu/İsmi - Skor/Saat - Deplasman Takım Logosu/İsmi).
* Maçın durumuna göre etiketler ("Canlı", "İY", "Bitti", "Ertelendi").

**Kullanıcı Deneyimi:**
* Maç kartlarının üzerine gelindiğinde (hover) hafif gölge veya renk değişimi ile tıklanabilir olduğunun hissettirilmesi.
* Veri yoksa "Bu tarihte maç bulunmamaktadır" şeklinde Empty State tasarımı.

**Teknik Detaylar:**
* URL'deki query parametrelerinin (örn: `?league=1&week=5`) okunup API'ye parametre olarak geçilmesi.
* Tailwind grid/flex yapıları ile maç kartlarının listelenmesi.

---

## 5. Maç Detayı Görüntüleme
* **API Endpoint:** `GET /matches/{matchld}`
* **Görev:** Seçilen spesifik bir maçın tüm detaylarının, istatistiklerinin ve kadrolarının gösterilmesi.

**UI Bileşenleri:**
* Büyük skor tabelası (Scoreboard).
* İstatistik sekmeleri (Tabs): "Maç Merkezi", "Kadrolar", "İstatistikler", "Yapay Zeka Tahmini".
* Topla oynama, şut, pas isabeti gibi veriler için progress bar tabanlı istatistik grafikleri.

**Kullanıcı Deneyimi:**
* Sekmeler arası geçişlerde sayfanın yenilenmemesi (Smooth component render).
* Canlı bir maç ise skorun periyodik olarak otomatik güncellenmesi (Auto-refresh/Polling).

**Teknik Detaylar:**
* React Router üzerinden dinamik ID (`/match/:id`) yakalama.
* API'den gelen detaylı JSON ağacının alt komponentlere (LineupComponent, StatsComponent vb.) prop olarak dağıtılması.

---

## 6. Takım Bilgisi Görüntüleme (Takım Profili)
* **API Endpoint:** `GET /teams/{teamld}`
* **Görev:** Takımın kadrosu, son maç form grafiği ve genel bilgilerinin yer aldığı profil sayfası.

**UI Bileşenleri:**
* Takım logosu, kuruluş yılı, stadyum bilgileri (Header).
* Son 5 maç form grafiği (G-G-B-M-G şeklinde ikonik gösterim).
* Kadro (Oyuncuların listesi/kartları).
* "Favorilere Ekle" butonu (Yıldız veya kalp ikonu).

**Kullanıcı Deneyimi:**
* Görsel ağırlıklı, form renklerinin takım renklerine göre dinamik şekillendiği temiz bir UI.
* Mobil uyumlu grid dizilimi.

**Teknik Detaylar:**
* Reusable (tekrar kullanılabilir) takım ve oyuncu kartı komponentlerinin oluşturulması.

---

## 7. Favori Takım Silme / Ekleme Yönetimi
* **API Endpoint:** `DELETE /users/{id}/favorites/{teamId}`
* **Görev:** Kullanıcının takip ettiği takımları favorilerinden çıkarması işlemi.

**UI Bileşenleri:**
* Profil sayfasındaki "Favori Takımlarım" listesinde her takımın yanındaki "Çarpı" veya "Dolu Yıldız/Boş Yıldız" ikonu.

**Kullanıcı Deneyimi:**
* Silme işlemine tıklandığında anında UI'dan kaybolması (Optimistic Update) ile hızlı hissiyat.
* Kullanıcıya alt kısımda "Takım favorilerden çıkarıldı. Geri al." şeklinde bir toast mesajı gösterilmesi.

**Teknik Detaylar:**
* İşlem sırasında API'ye `DELETE` isteği atılması, istek başarısız olursa UI'ın eski haline (rollback) döndürülmesi.

---

## 8. Yapay Zeka Tahmini Oluşturma (AI Prediction)
* **API Endpoint:** `POST /predictions/generate`
* **Görev:** Maçlar için yapay zeka destekli skor ve sonuç tahmini üretilmesi ve kullanıcıya sunulması.

**UI Bileşenleri:**
* Maç detay sayfasında "Yapay Zeka Tahmini Al" butonu (Özel, dikkat çekici stil).
* Tahmin üretilirken gösterilecek özel animasyon (Bot/Beyin ikonu veya analiz ediliyor hissiyatı veren skeleton loading).
* Sonuç Kartı: Kazanma yüzdeleri (Pasta grafik veya bar grafik), beklenen skor ve AI analiz metni.

**Kullanıcı Deneyimi:**
* AI işlemleri birkaç saniye sürebileceği için kullanıcıyı sıkmayacak ilerleme durumu (Progress indicator).
* Tahmin geldiğinde yumuşak bir geçişle (Fade-in) sonucun ekranda belirmesi.

**Teknik Detaylar:**
* API yanıt süresi uzun olabileceği için asenkron istek yönetimi.
* Gelen istatistiksel verilerin görselleştirilmesi.
