# API Tasarımı - OpenAPI Specification Örneği

**OpenAPI Spesifikasyon Dosyası:** [Goalio.yaml](Goalio.yaml)

Bu doküman, OpenAPI Specification (OAS) 3.0 standardına göre hazırlanmış örnek bir API tasarımını içermektedir.

## OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Goalio - Maç ve Tahmin Yönetim API'si
  version: 1.0.0
  description: >
    Goalio REST API; kullanıcı hesap işlemleri, maçların listelenmesi (canlı/geçmiş/arama),
    takım bilgileri, favoriler, kullanıcı tahminleri ve yapay zekâ destekli tahmin üretimi
    için tasarlanmıştır. API JWT tabanlı kimlik doğrulama ile korunur.
  contact:
    name: Emircan Bartan
    email: emircan.bartan24@gmail.com

servers:
  - url: https://api.goalio.com
    description: Üretim sunucusu (Production)
  - url: https://staging-api.goalio.com
    description: Test sunucusu (Staging)
  - url: https://localhost:3000
    description: Yerel geliştirme sunucusu (Development)

tags:
  - name: Kimlik Doğrulama
    description: Kayıt, giriş ve çıkış işlemleri
  - name: Kullanıcılar
    description: Kullanıcı profili, şifre, bildirim ayarları, favoriler ve kullanıcı tahminleri
  - name: Maçlar
    description: Maçları listeleme, arama, canlı/geçmiş maçlar ve skor/istatistik işlemleri
  - name: Takımlar
    description: Takım bilgilerini görüntüleme
  - name: Tahminler
    description: Yapay zekâ ile tahmin üretme ve maç tahmini görüntüleme

security:
  - BearerAuth: []

paths:
  /users/register:
    post:
      tags: [Kimlik Doğrulama]
      summary: Kullanıcı Kaydı
      operationId: registerUser
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/RegisterInput"
      responses:
        "201":
          description: Kullanıcı başarıyla oluşturuldu
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResponse"
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/login:
    post:
      tags: [Kimlik Doğrulama]
      summary: Kullanıcı Girişi
      operationId: loginUser
      security: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/LoginInput"
      responses:
        "200":
          description: Giriş başarılı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AuthResponse"
        "401":
          description: Kimlik bilgileri hatalı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/logout:
    post:
      tags: [Kimlik Doğrulama]
      summary: Kullanıcı Çıkışı
      operationId: logoutUser
      responses:
        "204":
          description: Çıkış başarılı
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}:
    parameters:
      - name: id
        in: path
        required: true
        description: Kullanıcının benzersiz kimlik numarası
        schema:
          type: string
        example: "usr123"

    get:
      tags: [Kullanıcılar]
      summary: Profil Görüntüleme
      operationId: getUserProfile
      responses:
        "200":
          description: Profil başarıyla getirildi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Kullanıcı bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

    put:
      tags: [Kullanıcılar]
      summary: Profil Güncelleme
      operationId: updateUserProfile
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UserUpdateInput"
      responses:
        "200":
          description: Profil başarıyla güncellendi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/User"
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Bu işlem için yetkiniz bulunmuyor
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Kullanıcı bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

    delete:
      tags: [Kullanıcılar]
      summary: Hesap Silme
      operationId: deleteUser
      responses:
        "204":
          description: Hesap başarıyla silindi
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Bu işlem için yetkiniz bulunmuyor
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Kullanıcı bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}/password:
    put:
      tags: [Kullanıcılar]
      summary: Şifre Değiştirme
      operationId: changePassword
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/PasswordChangeInput"
      responses:
        "204":
          description: Şifre başarıyla değiştirildi
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Yetkisiz işlem
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}/notifications:
    put:
      tags: [Kullanıcılar]
      summary: Bildirim Tercihlerini Güncelleme
      operationId: updateNotificationPrefs
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/NotificationPrefsInput"
      responses:
        "200":
          description: Bildirim ayarları güncellendi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/NotificationPrefs"
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Yetkisiz işlem
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}/favorites:
    get:
      tags: [Kullanıcılar]
      summary: Favori Takımları Listeleme
      operationId: listFavoriteTeams
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
      responses:
        "200":
          description: Favoriler listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Team"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Yetkisiz işlem
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

    post:
      tags: [Kullanıcılar]
      summary: Favori Takım Ekleme
      operationId: addFavoriteTeam
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/FavoriteTeamInput"
      responses:
        "201":
          description: Favori takım eklendi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Team"
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Takım bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}/favorites/{teamId}:
    delete:
      tags: [Kullanıcılar]
      summary: Favori Takım Silme
      operationId: removeFavoriteTeam
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
        - name: teamId
          in: path
          required: true
          description: Silinecek takım kimliği
          schema:
            type: string
          example: "tm45"
      responses:
        "204":
          description: Favori takım silindi
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Yetkisiz işlem
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Favori/takım bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}/predictions:
    post:
      tags: [Kullanıcılar]
      summary: Kullanıcı Tahmini Kaydetme
      operationId: saveUserPrediction
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/UserPredictionInput"
      responses:
        "201":
          description: Tahmin kaydedildi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/UserPrediction"
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Maç bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /users/{id}/predictions/{predictionId}:
    delete:
      tags: [Kullanıcılar]
      summary: Tahmin Silme
      operationId: deleteUserPrediction
      parameters:
        - name: id
          in: path
          required: true
          description: Kullanıcı kimliği
          schema:
            type: string
          example: "usr123"
        - name: predictionId
          in: path
          required: true
          description: Silinecek tahmin kimliği
          schema:
            type: string
          example: "prd789"
      responses:
        "204":
          description: Tahmin silindi
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Yetkisiz işlem
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Tahmin bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches:
    get:
      tags: [Maçlar]
      summary: Maçları Listeleme
      operationId: listMatches
      parameters:
        - name: league
          in: query
          required: false
          description: Lig bazlı filtre (leagueId)
          schema:
            type: string
          example: "l123"
        - name: page
          in: query
          required: false
          description: Sayfa numarası (varsayılan 1)
          schema:
            type: integer
            minimum: 1
            default: 1
          example: 1
        - name: limit
          in: query
          required: false
          description: Sayfa başına sonuç sayısı (varsayılan 10, maksimum 50)
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 10
          example: 10
      responses:
        "200":
          description: Maçlar başarıyla listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Match"
        "400":
          description: Geçersiz sorgu parametreleri
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches/live:
    get:
      tags: [Maçlar]
      summary: Canlı Maçları Görüntüleme
      operationId: listLiveMatches
      responses:
        "200":
          description: Canlı maçlar listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Match"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches/history:
    get:
      tags: [Maçlar]
      summary: Geçmiş Maçları Listeleme
      operationId: listHistoryMatches
      parameters:
        - name: page
          in: query
          required: false
          description: Sayfa numarası (varsayılan 1)
          schema:
            type: integer
            minimum: 1
            default: 1
          example: 1
        - name: limit
          in: query
          required: false
          description: Sayfa başına sonuç sayısı (varsayılan 10, maksimum 50)
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 10
          example: 10
      responses:
        "200":
          description: Geçmiş maçlar listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Match"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches/search:
    get:
      tags: [Maçlar]
      summary: Maç Arama
      operationId: searchMatches
      parameters:
        - name: q
          in: query
          required: true
          description: Arama anahtar kelimesi
          schema:
            type: string
            minLength: 1
          example: "Galatasaray"
        - name: page
          in: query
          required: false
          description: Sayfa numarası (varsayılan 1)
          schema:
            type: integer
            minimum: 1
            default: 1
          example: 1
        - name: limit
          in: query
          required: false
          description: Sayfa başına sonuç sayısı (varsayılan 10, maksimum 50)
          schema:
            type: integer
            minimum: 1
            maximum: 50
            default: 10
          example: 10
      responses:
        "200":
          description: Arama sonuçları listelendi
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: "#/components/schemas/Match"
        "400":
          description: Geçersiz arama parametresi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches/{matchId}:
    parameters:
      - name: matchId
        in: path
        required: true
        description: Maç kimliği
        schema:
          type: string
        example: "m555"

    get:
      tags: [Maçlar]
      summary: Maç Detayı Görüntüleme
      operationId: getMatch
      responses:
        "200":
          description: Maç detayı getirildi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Match"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Maç bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches/{matchId}/score:
    put:
      tags: [Maçlar]
      summary: Maç Skoru Güncelleme
      operationId: updateMatchScore
      parameters:
        - name: matchId
          in: path
          required: true
          description: Maç kimliği
          schema:
            type: string
          example: "m555"
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/ScoreUpdateInput"
      responses:
        "200":
          description: Skor güncellendi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Match"
        "400":
          description: Geçersiz skor verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "403":
          description: Yetkili kullanıcı gerekli
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Maç bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /matches/{matchId}/stats:
    get:
      tags: [Maçlar]
      summary: Maç İstatistiklerini Görüntüleme
      operationId: getMatchStats
      parameters:
        - name: matchId
          in: path
          required: true
          description: Maç kimliği
          schema:
            type: string
          example: "m555"
      responses:
        "200":
          description: İstatistikler getirildi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/MatchStats"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Maç bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /teams/{teamId}:
    get:
      tags: [Takımlar]
      summary: Takım Bilgisi Görüntüleme
      operationId: getTeam
      parameters:
        - name: teamId
          in: path
          required: true
          description: Takım kimliği
          schema:
            type: string
          example: "tm45"
      responses:
        "200":
          description: Takım bilgisi getirildi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Team"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Takım bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /predictions/{matchId}:
    get:
      tags: [Tahminler]
      summary: Maç Tahmini Görüntüleme
      operationId: getMatchPrediction
      parameters:
        - name: matchId
          in: path
          required: true
          description: Maç kimliği
          schema:
            type: string
          example: "m555"
      responses:
        "200":
          description: Tahmin getirildi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AIPrediction"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Tahmin bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

  /predictions/generate:
    post:
      tags: [Tahminler]
      summary: Tahmin Oluşturma
      operationId: generatePrediction
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: "#/components/schemas/GeneratePredictionInput"
      responses:
        "201":
          description: Yapay zekâ tahmini oluşturuldu
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/AIPrediction"
        "400":
          description: Geçersiz istek verisi
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "401":
          description: Kimlik doğrulama başarısız
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"
        "404":
          description: Maç bulunamadı
          content:
            application/json:
              schema:
                $ref: "#/components/schemas/Error"

components:
  securitySchemes:
    BearerAuth:
      type: apiKey
      in: header
      name: Authorization
      description: 'JWT tabanlı kimlik doğrulama. İstek başlığına "Authorization: Bearer <token>" eklenmeli.'

  schemas:
    # ============== Common ==============
    Error:
      type: object
      description: Hata durumlarında döndürülen standart hata yanıtı
      properties:
        message:
          type: string
          example: "İşlem başarısız"
      required: [message]

    # ============== Auth / Users ==============
    RegisterInput:
      type: object
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 30
          example: "emircanb"
        email:
          type: string
          format: email
          example: "emircan.bartan24@gmail.com"
        password:
          type: string
          format: password
          minLength: 6
          example: "P@ssw0rd!"
      required: [username, email, password]

    LoginInput:
      type: object
      properties:
        email:
          type: string
          format: email
          example: "emircan.bartan24@gmail.com"
        password:
          type: string
          format: password
          example: "P@ssw0rd!"
      required: [email, password]

    AuthResponse:
      type: object
      properties:
        token:
          type: string
          description: JWT erişim token'ı
          example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
        user:
          $ref: "#/components/schemas/User"
      required: [token, user]

    User:
      type: object
      properties:
        _id:
          type: string
          example: "usr123"
        username:
          type: string
          example: "emircanb"
        email:
          type: string
          format: email
          example: "emircan.bartan24@gmail.com"
        createdOn:
          type: string
          format: date-time
          example: "2026-03-01T12:00:00Z"
      required: [_id, username, email]

    UserUpdateInput:
      type: object
      properties:
        username:
          type: string
          minLength: 3
          maxLength: 30
          example: "emircanb"
        email:
          type: string
          format: email
          example: "emircan.bartan24@gmail.com"
      additionalProperties: false

    PasswordChangeInput:
      type: object
      properties:
        currentPassword:
          type: string
          format: password
          example: "OldP@ss1"
        newPassword:
          type: string
          format: password
          minLength: 6
          example: "NewP@ss2"
      required: [currentPassword, newPassword]

    NotificationPrefsInput:
      type: object
      properties:
        matchStart:
          type: boolean
          example: true
        goalAlerts:
          type: boolean
          example: true
        favoriteTeamNews:
          type: boolean
          example: false
      additionalProperties: false

    NotificationPrefs:
      type: object
      properties:
        matchStart:
          type: boolean
          example: true
        goalAlerts:
          type: boolean
          example: true
        favoriteTeamNews:
          type: boolean
          example: false
      required: [matchStart, goalAlerts, favoriteTeamNews]

    FavoriteTeamInput:
      type: object
      properties:
        teamId:
          type: string
          example: "tm45"
      required: [teamId]

    # ============== Teams ==============
    Team:
      type: object
      properties:
        _id:
          type: string
          example: "tm45"
        name:
          type: string
          example: "Galatasaray"
        leagueId:
          type: string
          example: "l123"
        country:
          type: string
          example: "TR"
      required: [_id, name]

    # ============== Matches ==============
    Match:
      type: object
      properties:
        _id:
          type: string
          example: "m555"
        leagueId:
          type: string
          example: "l123"
        homeTeam:
          $ref: "#/components/schemas/Team"
        awayTeam:
          $ref: "#/components/schemas/Team"
        status:
          type: string
          description: Maç durumu
          enum: [scheduled, live, finished]
          example: "live"
        startTime:
          type: string
          format: date-time
          example: "2026-03-04T18:00:00Z"
        score:
          $ref: "#/components/schemas/Score"
      required: [_id, homeTeam, awayTeam, status, startTime]

    Score:
      type: object
      properties:
        home:
          type: integer
          minimum: 0
          example: 1
        away:
          type: integer
          minimum: 0
          example: 0
      required: [home, away]

    ScoreUpdateInput:
      type: object
      properties:
        home:
          type: integer
          minimum: 0
          example: 2
        away:
          type: integer
          minimum: 0
          example: 1
      required: [home, away]

    MatchStats:
      type: object
      properties:
        matchId:
          type: string
          example: "m555"
        possessionHome:
          type: integer
          minimum: 0
          maximum: 100
          example: 55
        possessionAway:
          type: integer
          minimum: 0
          maximum: 100
          example: 45
        shotsHome:
          type: integer
          minimum: 0
          example: 10
        shotsAway:
          type: integer
          minimum: 0
          example: 7
      required: [matchId]

    # ============== Predictions ==============
    GeneratePredictionInput:
      type: object
      properties:
        matchId:
          type: string
          example: "m555"
      required: [matchId]

    AIPrediction:
      type: object
      properties:
        _id:
          type: string
          example: "ai901"
        matchId:
          type: string
          example: "m555"
        model:
          type: string
          example: "goalio-ai-v1"
        predictedWinner:
          type: string
          nullable: true
          description: Beraberlik olasılığında null olabilir
          example: "tm45"
        probabilities:
          type: object
          properties:
            homeWin:
              type: number
              format: float
              example: 0.52
            draw:
              type: number
              format: float
              example: 0.25
            awayWin:
              type: number
              format: float
              example: 0.23
          required: [homeWin, draw, awayWin]
        createdOn:
          type: string
          format: date-time
          example: "2026-03-04T12:30:00Z"
      required: [_id, matchId, model, probabilities, createdOn]

    UserPredictionInput:
      type: object
      properties:
        matchId:
          type: string
          example: "m555"
        predictedResult:
          type: string
          description: Kullanıcının tahmini (ör: "homeWin", "draw", "awayWin" veya "2-1")
          example: "homeWin"
        note:
          type: string
          maxLength: 200
          example: "Form durumuna göre ev sahibi daha avantajlı."
      required: [matchId, predictedResult]

    UserPrediction:
      type: object
      properties:
        _id:
          type: string
          example: "prd789"
        userId:
          type: string
          example: "usr123"
        matchId:
          type: string
          example: "m555"
        predictedResult:
          type: string
          example: "homeWin"
        note:
          type: string
          example: "Form durumuna göre ev sahibi daha avantajlı."
        createdOn:
          type: string
          format: date-time
          example: "2026-03-04T12:35:00Z"
      required: [_id, userId, matchId, predictedResult, createdOn]
``