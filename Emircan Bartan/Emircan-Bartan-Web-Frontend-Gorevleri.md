1. Kullanıcı Kaydı (Register) Sayfası
API Endpoint: POST /users/register

Görev: Yeni bir kullanıcı hesabı oluşturulması için arayüz tasarımı ve API entegrasyonu.

UI Bileşenleri:

Ad, Soyad, Email, Şifre ve Şifre Tekrar inputları.

"Kayıt Ol" butonu (Primary).

"Zaten hesabın var mı? Giriş yap" yönlendirme linki.

İşlem sırasında butonda "loading" animasyonu.

Form Validasyonu:

Şifrelerin birbiriyle eşleştiğinin anlık (real-time) kontrolü.

Minimum şifre uzunluğu ve zorunlu alan uyarıları.

Kullanıcı Deneyimi:

Kayıt başarılı olduğunda kullanıcıyı otomatik olarak Login (Giriş) sayfasına yönlendirme ve "Kayıt başarılı, lütfen giriş yapın" mesajı (Toast notification).

Bu email zaten kayıtlıysa ilgili inputun altında kırmızı hata mesajı.

2. Kullanıcı Çıkışı (Logout) Akışı
API Endpoint: POST /users/logout

Görev: Aktif kullanıcının oturumunu güvenli bir şekilde sonlandırması.

UI Bileşenleri:

Header'da (veya Sidebar/Profil menüsünde) yer alan "Çıkış Yap" butonu veya ikonu.

Kullanıcı Deneyimi:

Yanlışlıkla tıklamalara karşı opsiyonel "Çıkış yapmak istediğinize emin misiniz?" pop-up'ı (Modal).

Tıklandığında bekletmeden ana sayfaya (veya giriş sayfasına) yönlendirme.

Teknik Detaylar:

Tarayıcıdaki localStorage veya sessionStorage içinde tutulan JWT Token ve kullanıcı bilgilerinin temizlenmesi.

Global kullanıcı state'inin (Context/Redux) sıfırlanması.

3. Profil Güncelleme Sayfası
API Endpoint: PUT /users/{id}

Görev: Kullanıcının ad, soyad gibi kişisel bilgilerini değiştirebildiği form yapısı.

UI Bileşenleri:

Mevcut kullanıcı bilgileriyle dolu olarak gelen input alanları.

"Değişiklikleri Kaydet" ve "İptal" butonları.

Kullanıcı Deneyimi:

Kullanıcı inputlarda hiçbir değişiklik yapmadıysa "Kaydet" butonunun inaktif (disabled) durumda beklemesi.

Güncelleme başarılı olduğunda sayfa yenilenmeden verilerin güncellenmesi (Optimistic UI) ve başarı mesajı gösterilmesi.

4. Hesap Silme (Delete Account) Akışı
API Endpoint: DELETE /users/{id}

Görev: Kullanıcının hesabını kalıcı olarak silmesi için güvenli ve uyarıcı bir arayüz.

UI Bileşenleri:

Profil ayarları sayfasının en altında kırmızı renkli "Hesabımı Sil" butonu (Danger zone).

Silme işlemine tıklandığında açılan uyarı Modalı (Dialog).

Kullanıcı Deneyimi:

İşlemin geri alınamaz olduğuna dair güçlü görsel uyarılar (kalın yazılar, uyarı ikonları).

Ekstra güvenlik için silme onayından önce kullanıcıdan şifresini tekrar girmesinin istenmesi.

Silme işlemi sonrası kullanıcının oturumunun kapatılıp ana sayfaya yönlendirilmesi.

5. Profil Görüntüleme Paneli
API Endpoint: GET /users/{id}

Görev: Kullanıcının kendi bilgilerini (veya diğer kullanıcıların açık bilgilerini) görebileceği özet ekran.

UI Bileşenleri:

Profil fotoğrafı alanı (varsayılan bir avatar/icon).

İsim, Soyisim, Kayıt tarihi gibi bilgilerin okunaklı bir şekilde listelenmesi.

Kullanıcı Deneyimi:

Sayfa açılırken veriler gelene kadar Skeleton Loading ekranı.

Kendi profiliyse hemen yanda "Profili Düzenle" butonuna hızlı erişim.

6. Genel Maçları Listeleme (Fikstür)
API Endpoint: GET /matches

Görev: Platformdaki tüm maçların listelendiği ana akış sayfası.

UI Bileşenleri:

Tarih filtreleme alanı (Bugün, Yarın, Geçmiş Maçlar vs.).

Liste veya grid şeklinde alt alta dizilmiş maç kartları.

Kullanıcı Deneyimi:

Çok fazla maç olabileceği için sayfalama (Pagination) veya aşağı indikçe yüklenme (Infinite Scroll) yapısı.

Geçmiş maçların skorlarının, gelecek maçların ise saatlerinin vurgulanması.

7. Canlı Maçları Görüntüleme Ekranı
API Endpoint: GET /matches/live

Görev: Sadece o an oynanmakta olan maçların listelendiği dinamik arayüz.

UI Bileşenleri:

Yanıp sönen kırmızı bir "Canlı" veya "Live" ibaresi (Badge/Indicator).

O anki skor ve maçın dakikası.

Kullanıcı Deneyimi:

Sayfanın kullanıcı tarafından yenilenmesine gerek kalmadan arka planda belirli aralıklarla (Polling) veya anlık olarak (WebSocket) skorların/dakikaların güncellenmesi.

Gol olduğunda skorun renginin anlık değişmesi veya hafif bir animasyon (Highlight).

8. Maç Tahmini Görüntüleme (AI Prediction)
API Endpoint: GET /predictions/{matchId}

Görev: Senin entegre ettiğin tahmini oluşturma sisteminin (POST) sonucunu getiren ve ekranda detaylıca gösteren sayfa.

UI Bileşenleri:

Kazanma olasılıklarını gösteren barlar (Progress bar - Örn: %60 Ev Sahibi, %20 Beraberlik, %20 Deplasman).

Yapay zekanın beklenen skor tahmini.

Neden bu tahminin yapıldığını anlatan AI analiz metni.

Kullanıcı Deneyimi:

Modern, fütüristik bir tasarım dili (Goalio temasına uygun yapay zeka vurgusu).

Eğer bu maç için henüz bir tahmin oluşturulmamışsa, "Tahmin henüz hazır değil" mesajı ve (senin API'ne yönlendiren) "Şimdi Oluştur" butonu sunulması.