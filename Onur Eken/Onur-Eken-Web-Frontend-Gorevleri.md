# Onur Eken'in REST API Metotlari
**API Test Videosu:** [YouTube Linki](https://youtu.be/qbRot2VPBa8)

# Goalio - Frontend ve API Entegrasyon Dokümantasyonu

Bu doküman, kullanıcı arayüzü (UI) bileşenleri, beklenen kullanıcı deneyimi (UX) ve ilgili API endpoint'lerinin entegrasyon detaylarını içerir.

---

## 1. Favori Takım Ekleme
> **Görev:** Kullanıcıların destekledikleri veya takip etmek istedikleri takımları favori listelerine eklemesini sağlayan UI etkileşimi.

* **API Endpoint:** `POST /users/{id}/favorites`

**UI Bileşenleri:**
* Takım detay sayfasında veya lig tablosunda takım isminin yanında **Yıldız** veya **Kalp** şeklinde buton.
* Tıklama esnasında kısa bir yükleniyor (*spinner*) durumu.

**Kullanıcı Deneyimi (UX):**
* Butona tıklandığında ikonun anında içinin dolması veya renk değiştirmesi (*Optimistic Update* ile bekleme hissini yok etme).
* İşlem başarılı olduğunda ekranın altında "Takım favorilere eklendi" şeklinde yeşil bir *Toast* mesajı belirmesi.

**Teknik Detaylar:**
* İstek atılırken kullanıcının ID'sinin ve takımın ID'sinin API'ye doğru *payload* ile gönderilmesi.
* Hata durumunda ikonun tekrar boş/eski haline (*rollback*) döndürülmesi.

---

## 2. Kullanıcı Tahmini Kaydetme
> **Görev:** Kullanıcının (yapay zeka haricinde) kendi hissettiği maç skorunu veya sonucunu sisteme girmesini sağlayan arayüz.

* **API Endpoint:** `POST /users/{id}/predictions`

**UI Bileşenleri:**
* Maç detay ekranında **"Senin Tahminin"** bölümü.
* Ev sahibi ve deplasman için iki adet sayısal *input* (Skor tahmini için) veya **MS1, MS0, MS2** butonları (Taraf tahmini için).
* **"Tahminimi Kaydet"** butonu.

**Form Validasyonu:**
* Skor inputlarına harf girilmesinin engellenmesi (Sadece rakam).
* Skor girilmeden veya taraf seçilmeden butonun pasif (*disabled*) kalması.

**Kullanıcı Deneyimi (UX):**
* Tahmin başarıyla kaydedildiğinde butonun yerine bir onay işareti (*Checkmark*) ve "Tahmininiz Alındı!" yazısının gelmesi.

---

## 3. Bildirim Tercihlerini Güncelleme
> **Görev:** Kullanıcının profil ayarları sayfasından, almak istediği bildirim türlerini yönetmesi.

* **API Endpoint:** `PUT /users/{id}/notifications`

**UI Bileşenleri:**
* Profil sayfasında **"Bildirim Ayarları"** sekmesi.
* "Gol Bildirimleri", "Maç Sonucu Bildirimleri", "Yapay Zeka Tahmin Uyarıları" gibi seçenekler için *Toggle* (Aç/Kapat) butonları.

**Kullanıcı Deneyimi (UX):**
* Ayrı bir "Kaydet" butonuna basmaya gerek kalmadan, *Toggle*'a tıklandığı anda tercihin kaydedilmesi ve küçük bir "Kaydedildi" yazısının belirip kaybolması.

**Teknik Detaylar:**
* `onChange` event'i ile anında `PUT` isteği atılması.
* Art arda tıklamaları engellemek için *Debounce* mantığı kullanılması.

---

## 4. Favori Takımları Listeleme
> **Görev:** Kullanıcının önceden favoriye eklediği tüm takımların profilinde topluca sergilenmesi.

* **API Endpoint:** `GET /users/{id}/favorites`

**UI Bileşenleri:**
* Profil sayfasında **"Favori Takımlarım"** başlığı altında takım kartları (Takım logosu + İsim).
* Kartların üzerinde hızlıca favoriden çıkarma (Çarpı/Eksi) butonu.

**Kullanıcı Deneyimi (UX):**
* Kullanıcının henüz favori takımı yoksa şık bir *Empty State* (Örn: Gri bir takım logosu ve "Henüz takım eklemediniz, maçlara göz atın" butonu).
* Kartların *Grid* yapısıyla mobil cihazlarda alt alta, masaüstünde yan yana düzgün listelenmesi.

---

## 5. Maç İstatistiklerini Görüntüleme
> **Görev:** Biten veya devam eden bir maçın topla oynama, şut, pas isabeti gibi verilerinin grafiksel olarak gösterilmesi.

* **API Endpoint:** `GET /matches/{matchId}/stats`



**UI Bileşenleri:**
* Maç detay sayfasında **"İstatistikler"** sekmesi.
* Karşılıklı iki renkli İlerleme Çubukları (*Progress Bars*) (Örn: Topla oynama %60 Ev Sahibi [Mavi] - %40 Deplasman [Kırmızı]).

**Kullanıcı Deneyimi (UX):**
* Sayfa veya sekme ilk açıldığında barların 0'dan ilgili değere doğru kayarak (animasyonlu) dolması.
* Veriler okunabilir ve zıt renklerle desteklenmiş olmalı.

**Teknik Detaylar:**
* Gelen istatistik değerlerinin toplamı 100 üzerinden hesaplanarak CSS ile genişlik (`width`) oranlarına dönüştürülmesi.

---

## 6. Geçmiş Maçları Listeleme
> **Görev:** Uygulamadaki veya belirli bir takımdaki tamamlanmış maçların geriye dönük listelenmesi.

* **API Endpoint:** `GET /matches/history`

**UI Bileşenleri:**
* Tarih, Lig veya Takım bazlı filtreleme seçenekleri (*Dropdown*).
* Sonuçlanmış maç kartları (Ortada saat yerine net maç skorunun yazması).

**Kullanıcı Deneyimi (UX):**
* Liste çok uzun olacağı için **"Daha Fazla Göster"** butonu (*Pagination*) veya sayfa altına indikçe yüklenme (*Infinite Scroll*) mekanizması.

---

## 7. Takım ve Oyuncu Arama
> **Görev:** Kullanıcıların sistemdeki herhangi bir takımı (veya oyuncuyu) hızlıca bulmasını sağlayan arama motoru arayüzü.

* **API Endpoint:** `GET /teams/search?q={keyword}`



**UI Bileşenleri:**
* Genel Header'da veya ayrı bir "Keşfet" sayfasında yer alan Arama Çubuğu (*Search Input*).
* Arama sonuçlarının listelendiği, aşağı doğru açılan bir kutucuk (*Dropdown* / *Modal*).

**Kullanıcı Deneyimi (UX):**
* Kullanıcı harfleri yazdıkça "Enter"a basmasını beklemeden sonuçların anlık olarak altında dökülmesi.
* Aranan kelime bulunamazsa "Sonuç bulunamadı" şeklinde kibar bir uyarı gösterilmesi.

**Teknik Detaylar:**
* Sunucuyu yormamak için her harfte değil, kullanıcı yazmayı bıraktıktan yarım saniye sonra (*Debounce* / `setTimeout`) API isteğinin atılması.

---

## 8. Tahmin Silme (Yapay Zeka ve Kullanıcı)
> **Görev:** Kullanıcının geçmişte yaptığı bir tahmini iptal etmesi veya silmesi işlemi.

* **API Endpoint:** `DELETE /users/{id}/predictions/{predictionId}`

**UI Bileşenleri:**
* Profildeki "Tahminlerim" listesinde, her tahminin yanında bulunan **"Çöp Kutusu"** ikonu.
* Silme Onay Ekranı (*Modal*).

**Kullanıcı Deneyimi (UX):**
* Yanlış tıklamalara karşı "Bu tahmini silmek istediğinizden emin misiniz?" sorusunun sorulması.
* Silme işlemi onaylandığında, ilgili tahmin kartının listeden kayarak (animasyonla) yok olması.
