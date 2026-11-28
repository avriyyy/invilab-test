# jobdesk-2 - Autentikasi & CRUD Peminjaman

**CRUD milikmu (backend + halaman): Peminjaman**

**Cara kerja:** langsung di branch `main`, tidak buat branch baru (mulai setelah `jobdesk-1` di-push ke main; `git pull` dulu sebelum mulai, commit + push langsung ke `main` setelah tiap langkah lolos cek).

Kamu membangun autentikasi (admin + anggota) dan CRUD Peminjaman end-to-end. Kerja langsung di `main` terbaru yang sudah berisi `jobdesk-1`. Baca `inisialisasi.md` dulu, terutama kontrak di bagian 3.

## Langkah 1 - Middleware autentikasi + role

Middleware memeriksa `Authorization: Bearer <token>`, menyimpan `user_id`, `user_email`, `user_role` di `c.Locals`, dan membatasi role. Perhatian: middleware role harus ditulis SEBELUM handler di route, karena Fiber v3 menjalankan handler sesuai urutan penulisan. **Commit:** `feat: middleware autentikasi + role` → push boleh.

**Path:** `backend/internal/middleware/auth.go`

```go
package middleware

import (
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
)

// Autentikasi memeriksa header Authorization: Bearer <token>.
// Kalau token valid, data pengguna disimpan di c.Locals("user_id"),
// c.Locals("user_email") dan c.Locals("user_role").
func Autentikasi(secret string) fiber.Handler {
	return func(c fiber.Ctx) error {
		header := c.Get("Authorization")
		if header == "" || !strings.HasPrefix(header, "Bearer ") {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Token tidak ditemukan, silakan login dulu.",
			})
		}

		tokenStr := strings.TrimPrefix(header, "Bearer ")
		token, err := jwt.Parse(tokenStr, func(t *jwt.Token) (interface{}, error) {
			if _, ok := t.Method.(*jwt.SigningMethodHMAC); !ok {
				return nil, fiber.ErrUnauthorized
			}
			return []byte(secret), nil
		})
		if err != nil || !token.Valid {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Token tidak valid atau sudah kedaluwarsa.",
			})
		}

		claims, ok := token.Claims.(jwt.MapClaims)
		if !ok {
			return c.Status(fiber.StatusUnauthorized).JSON(fiber.Map{
				"success": false,
				"message": "Token tidak valid.",
			})
		}

		c.Locals("user_id", uint(claims["sub"].(float64)))
		c.Locals("user_email", claims["email"].(string))
		c.Locals("user_role", claims["role"].(string))
		return c.Next()
	}
}

// HanyaPeran membatasi endpoint ke role tertentu.
// PENTING: middleware ini harus ditulis SEBELUM handler di route,
// karena Fiber v3 menjalankan handler sesuai urutan penulisan.
// Kalau ditulis setelah handler, handler langsung menjawab tanpa
// memanggil c.Next(), sehingga role tidak pernah diperiksa.
func HanyaPeran(peran ...string) fiber.Handler {
	return func(c fiber.Ctx) error {
		role, _ := c.Locals("user_role").(string)
		for _, p := range peran {
			if role == p {
				return c.Next()
			}
		}
		return c.Status(fiber.StatusForbidden).JSON(fiber.Map{
			"success": false,
			"message": "Akses ditolak, role kamu tidak punya hak untuk ini.",
		})
	}
}
```

## Langkah 2 - Model User (sisipan di models.go)

File `models.go` milik jobdesk-1. Struct Peminjaman sudah ditulis jobdesk-1 di kerangka (dipakai guard hapus Barang). Kamu hanya menambahkan struct User dan request di titik yang ditandai, jangan menulis ulang file-nya. **Commit:** `feat: model User` → push boleh.

Sisipkan struct User tepat sebelum komentar `// Kategori mengelompokkan barang.`:

**Path:** `backend/internal/model/models.go`

```go
// User adalah akun pengguna aplikasi. Role: admin atau anggota.
// Tabel user tidak dihitung sebagai CRUD.
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Nama      string         `gorm:"size:100;not null" json:"nama"`
	Email     string         `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Role      string         `gorm:"size:20;not null;default:anggota" json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}
```

Sisipkan request registrasi dan login tepat sebelum `type BarangRequest struct {`:

**Path:** `backend/internal/model/models.go`

```go
// Request registrasi. Role tidak bisa dipilih dari publik, selalu anggota.
type RegisterRequest struct {
	Nama     string `json:"nama" validate:"required,min=3,max=100"`
	Email    string `json:"email" validate:"required,email,max=100"`
	Password string `json:"password" validate:"required,min=6,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}
```

Tambahkan request peminjaman di akhir file:

**Path:** `backend/internal/model/models.go`

```go
type PeminjamanRequest struct {
	BarangID       uint   `json:"barang_id" validate:"required"`
	NamaPeminjam   string `json:"nama_peminjam" validate:"required,min=3,max=100"`
	NIM            string `json:"nim" validate:"required,min=5,max=20"`
	TanggalPinjam  string `json:"tanggal_pinjam" validate:"required"`
	TanggalKembali string `json:"tanggal_kembali"`
	Status         string `json:"status" validate:"omitempty,oneof=Dipinjam Dikembalikan"`
}
```

## Langkah 3 - Handler autentikasi

Registrasi (role selalu anggota, registrasi publik tidak boleh memilih admin), login (JWT berlaku 24 jam), profil, logout (token dihapus di frontend). Kata sandi disimpan sebagai hash bcrypt dan tidak pernah muncul di respons. **Commit:** `feat: autentikasi (register, login, profil, logout)` → push boleh.

**Path:** `backend/internal/handler/auth_handler.go`

```go
package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"github.com/golang-jwt/jwt/v5"
	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"invilab/internal/model"
)

// AuthHandler menangani registrasi, login, profil, dan logout.
type AuthHandler struct {
	DB        *gorm.DB
	JWTSecret string
}

func NewAuthHandler(db *gorm.DB, secret string) *AuthHandler {
	return &AuthHandler{DB: db, JWTSecret: secret}
}

// Register membuat akun baru. Role selalu anggota, registrasi publik
// tidak boleh memilih role admin.
func (h *AuthHandler) Register(c fiber.Ctx) error {
	var req model.RegisterRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	var ada model.User
	if err := h.DB.Where("email = ?", req.Email).First(&ada).Error; err == nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Email sudah terdaftar.")
	}

	hash, err := bcrypt.GenerateFromPassword([]byte(req.Password), bcrypt.DefaultCost)
	if err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Terjadi kesalahan di server.")
	}

	user := model.User{Nama: req.Nama, Email: req.Email, Password: string(hash), Role: "anggota"}
	if err := h.DB.Create(&user).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal membuat akun.")
	}
	return Sukses(c, fiber.StatusCreated, "Akun berhasil dibuat, silakan login.", fiber.Map{
		"id": user.ID, "nama": user.Nama, "email": user.Email, "role": user.Role,
	})
}

// Login memeriksa email dan password, lalu mengembalikan JWT yang
// berlaku 24 jam.
func (h *AuthHandler) Login(c fiber.Ctx) error {
	var req model.LoginRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	var user model.User
	if err := h.DB.Where("email = ?", req.Email).First(&user).Error; err != nil {
		return Gagal(c, fiber.StatusUnauthorized, "Email atau password salah.")
	}
	if err := bcrypt.CompareHashAndPassword([]byte(user.Password), []byte(req.Password)); err != nil {
		return Gagal(c, fiber.StatusUnauthorized, "Email atau password salah.")
	}

	token, err := h.buatToken(&user)
	if err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal membuat token.")
	}
	return Sukses(c, fiber.StatusOK, "Login berhasil.", fiber.Map{
		"token": token,
		"user": fiber.Map{
			"id": user.ID, "nama": user.Nama, "email": user.Email, "role": user.Role,
		},
	})
}

// Profile mengembalikan data pengguna yang sedang login.
func (h *AuthHandler) Profile(c fiber.Ctx) error {
	id, _ := c.Locals("user_id").(uint)
	var user model.User
	if err := h.DB.First(&user, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Pengguna tidak ditemukan.")
	}
	return Sukses(c, fiber.StatusOK, "Profil ditemukan.", fiber.Map{
		"id": user.ID, "nama": user.Nama, "email": user.Email, "role": user.Role,
	})
}

// Logout cukup menghapus token di frontend. Endpoint ini hanya
// penanda supaya alur logout jelas di sisi klien.
func (h *AuthHandler) Logout(c fiber.Ctx) error {
	return Sukses(c, fiber.StatusOK, "Logout berhasil.", nil)
}

func (h *AuthHandler) buatToken(user *model.User) (string, error) {
	claims := jwt.MapClaims{
		"sub":   user.ID,
		"email": user.Email,
		"role":  user.Role,
		"exp":   time.Now().Add(24 * time.Hour).Unix(),
	}
	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(h.JWTSecret))
}
```

## Langkah 4 - CRUD Peminjaman

Daftar dengan Preload Barang + filter `?status=` + pagination, detail dengan Preload Barang, buat (semua role yang sudah login boleh meminjam), ubah dan hapus (admin saja). **Commit:** `feat: CRUD Peminjaman + Preload Barang` → push boleh.

**Path:** `backend/internal/handler/peminjaman_handler.go`

```go
package handler

import (
	"time"

	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/model"
)

// PeminjamanHandler menangani CRUD peminjaman.
type PeminjamanHandler struct {
	DB *gorm.DB
}

func NewPeminjamanHandler(db *gorm.DB) *PeminjamanHandler {
	return &PeminjamanHandler{DB: db}
}

// List mengembalikan daftar peminjaman beserta data barangnya (Preload).
// Bisa difilter dengan query ?status=Dipinjam.
func (h *PeminjamanHandler) List(c fiber.Ctx) error {
	page, limit, offset := Pagination(c)
	status := c.Query("status", "")

	q := h.DB.Model(&model.Peminjaman{}).Preload("Barang")
	if status != "" {
		q = q.Where("status = ?", status)
	}

	var total int64
	q.Count(&total)

	var daftar []model.Peminjaman
	if err := q.Order("created_at DESC").Limit(limit).Offset(offset).Find(&daftar).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal mengambil data peminjaman.")
	}
	return Sukses(c, fiber.StatusOK, "Daftar peminjaman ditemukan.", fiber.Map{
		"items":      daftar,
		"pagination": MetaPagination(page, limit, total),
	})
}

// Detail mengembalikan satu peminjaman beserta data barangnya.
func (h *PeminjamanHandler) Detail(c fiber.Ctx) error {
	id := c.Params("id")
	var pinjam model.Peminjaman
	if err := h.DB.Preload("Barang").First(&pinjam, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Peminjaman tidak ditemukan.")
	}
	return Sukses(c, fiber.StatusOK, "Peminjaman ditemukan.", pinjam)
}

// Create membuat peminjaman baru. Semua role yang sudah login boleh meminjam.
func (h *PeminjamanHandler) Create(c fiber.Ctx) error {
	var req model.PeminjamanRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	var barang model.Barang
	if err := h.DB.First(&barang, req.BarangID).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Barang tidak ditemukan.")
	}

	tglPinjam, err := time.Parse("2006-01-02", req.TanggalPinjam)
	if err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Format tanggal pinjam harus YYYY-MM-DD.")
	}

	pinjam := model.Peminjaman{
		BarangID:      req.BarangID,
		NamaPeminjam:  req.NamaPeminjam,
		NIM:           req.NIM,
		TanggalPinjam: tglPinjam,
		Status:        "Dipinjam",
	}
	if req.TanggalKembali != "" {
		tglKembali, err := time.Parse("2006-01-02", req.TanggalKembali)
		if err != nil {
			return Gagal(c, fiber.StatusUnprocessableEntity, "Format tanggal kembali harus YYYY-MM-DD.")
		}
		pinjam.TanggalKembali = &tglKembali
	}

	if err := h.DB.Create(&pinjam).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal membuat peminjaman.")
	}
	h.DB.Preload("Barang").First(&pinjam, pinjam.ID)
	return Sukses(c, fiber.StatusCreated, "Peminjaman berhasil dibuat.", pinjam)
}

// Update mengubah peminjaman, dipakai admin untuk mengubah status
// dan tanggal kembali. Hanya admin.
func (h *PeminjamanHandler) Update(c fiber.Ctx) error {
	id := c.Params("id")
	var pinjam model.Peminjaman
	if err := h.DB.First(&pinjam, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Peminjaman tidak ditemukan.")
	}

	var req model.PeminjamanRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	var barang model.Barang
	if err := h.DB.First(&barang, req.BarangID).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Barang tidak ditemukan.")
	}

	tglPinjam, err := time.Parse("2006-01-02", req.TanggalPinjam)
	if err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Format tanggal pinjam harus YYYY-MM-DD.")
	}

	pinjam.BarangID = req.BarangID
	pinjam.NamaPeminjam = req.NamaPeminjam
	pinjam.NIM = req.NIM
	pinjam.TanggalPinjam = tglPinjam
	if req.Status != "" {
		pinjam.Status = req.Status
	}
	if req.TanggalKembali != "" {
		tglKembali, err := time.Parse("2006-01-02", req.TanggalKembali)
		if err != nil {
			return Gagal(c, fiber.StatusUnprocessableEntity, "Format tanggal kembali harus YYYY-MM-DD.")
		}
		pinjam.TanggalKembali = &tglKembali
	}

	if err := h.DB.Save(&pinjam).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal mengubah peminjaman.")
	}
	h.DB.Preload("Barang").First(&pinjam, pinjam.ID)
	return Sukses(c, fiber.StatusOK, "Peminjaman berhasil diubah.", pinjam)
}

// Delete menghapus peminjaman. Hanya admin.
func (h *PeminjamanHandler) Delete(c fiber.Ctx) error {
	id := c.Params("id")
	var pinjam model.Peminjaman
	if err := h.DB.First(&pinjam, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Peminjaman tidak ditemukan.")
	}
	if err := h.DB.Delete(&pinjam).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal menghapus peminjaman.")
	}
	return Sukses(c, fiber.StatusOK, "Peminjaman berhasil dihapus.", nil)
}
```

## Langkah 5 - Router: route auth + peminjaman + pasang middleware

Di langkah ini kamu memasang middleware ke router. Perhatikan: jobdesk-1 menulis route barang tanpa middleware; di langkah ini grup barang diganti dengan versi yang dilindungi middleware. **Commit:** `feat: route auth + peminjaman + middleware` → push boleh.

Tambahkan import middleware di `router.go`. Ganti blok import berikut:

**Path:** `backend/internal/router/router.go`

```go
import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/handler"
)
```

menjadi:

**Path:** `backend/internal/router/router.go`

```go
import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/handler"
	"invilab/internal/middleware"
)
```

Tambahkan dua baris constructor di `func Setup`. Baris auth tepat sebelum baris `barang := handler.NewBarangHandler(db)`:

**Path:** `backend/internal/router/router.go`

```go
	auth := handler.NewAuthHandler(db, jwtSecret)
```

Baris peminjaman tepat setelah baris `barang := handler.NewBarangHandler(db)`:

**Path:** `backend/internal/router/router.go`

```go
	pinjam := handler.NewPeminjamanHandler(db)
```

Sisipkan grup route auth + blok pelindung tepat sebelum komentar `// Barang: baca boleh semua role, tulis hanya admin.`:

**Path:** `backend/internal/router/router.go`

```go
	// Autentikasi: registrasi dan login terbuka, sisanya butuh token.
	authGroup := api.Group("/auth")
	authGroup.Post("/register", auth.Register)
	authGroup.Post("/login", auth.Login)
	authGroup.Get("/profile", middleware.Autentikasi(jwtSecret), auth.Profile)
	authGroup.Post("/logout", middleware.Autentikasi(jwtSecret), auth.Logout)

	// Semua endpoint resource butuh login.
	lindungi := middleware.Autentikasi(jwtSecret)
	admin := middleware.HanyaPeran("admin")
```

Ganti blok route barang (versi jobdesk-1 tanpa middleware) berikut:

**Path:** `backend/internal/router/router.go`

```go
	// Barang: baca boleh semua role, tulis hanya admin.
	b := api.Group("/barang")
	b.Get("/", barang.List)
	b.Get("/:id", barang.Detail)
	b.Post("/", barang.Create)
	b.Put("/:id", barang.Update)
	b.Delete("/:id", barang.Delete)
```

menjadi (perhatikan `lindungi` di grup dan `admin` sebelum handler tulis):

**Path:** `backend/internal/router/router.go`

```go
	// Barang: baca boleh semua role, tulis hanya admin.
	b := api.Group("/barang", lindungi)
	b.Get("/", barang.List)
	b.Get("/:id", barang.Detail)
	b.Post("/", admin, barang.Create)
	b.Put("/:id", admin, barang.Update)
	b.Delete("/:id", admin, barang.Delete)
```

Tambahkan grup route peminjaman tepat sebelum kurung tutup `func Setup` (akhir file):

**Path:** `backend/internal/router/router.go`

```go
	// Peminjaman: baca dan buat boleh semua role yang login,
	// ubah dan hapus hanya admin.
	p := api.Group("/peminjaman", lindungi)
	p.Get("/", pinjam.List)
	p.Get("/:id", pinjam.Detail)
	p.Post("/", pinjam.Create)
	p.Put("/:id", admin, pinjam.Update)
	p.Delete("/:id", admin, pinjam.Delete)
```

Terakhir, ubah baris `AutoMigrate` di `main.go`:

**Path:** `backend/cmd/api/main.go`

```go
db.AutoMigrate(&model.Barang{})
```

menjadi:

**Path:** `backend/cmd/api/main.go`

```go
db.AutoMigrate(&model.User{}, &model.Barang{}, &model.Peminjaman{})
```

Baris ini titik gabung dengan jobdesk-3, yang nanti menambahkan `&model.Kategori{},` setelah `&model.User{},`.

## Langkah 6 - Seed: akun demo + peminjaman

Tambahkan potongan berikut di `seed.go`. **Commit:** `feat: seed akun demo + peminjaman` → push boleh.

Ganti baris komentar `Run` berikut:

**Path:** `backend/internal/seed/seed.go`

```go
// Run mengisi data contoh barang kalau tabel barang masih kosong.
```

menjadi:

**Path:** `backend/internal/seed/seed.go`

```go
// Run mengisi data awal kalau tabel user masih kosong:
// dua akun demo (admin dan anggota), empat kategori, delapan barang,
// dan dua peminjaman contoh. Dijalankan sekali saat server pertama
// kali menyala dengan basis data kosong.
//
// Dua akun demo dipastikan di setiap boot (bukan hanya saat seed):
// kalau akun demo sudah ada tapi rolenya salah, rolenya dibetulkan.
// Ini menjaga akun admin tetap admin walau barisnya dibuat lebih
// dulu oleh proses lain.
```

Ganti blok import berikut:

**Path:** `backend/internal/seed/seed.go`

```go
import (
	"gorm.io/gorm"

	"invilab/internal/model"
)
```

menjadi:

**Path:** `backend/internal/seed/seed.go`

```go
import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"invilab/internal/model"
)
```

Sisipkan blok akun demo tepat setelah baris `func Run(db *gorm.DB) {`:

**Path:** `backend/internal/seed/seed.go`

```go
	pastikanAkun := func(nama, email, password, role string) {
		var user model.User
		if err := db.Where("email = ?", email).First(&user).Error; err != nil {
			hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
			db.Create(&model.User{Nama: nama, Email: email, Password: string(hash), Role: role})
			return
		}
		if user.Role != role {
			db.Model(&user).Update("role", role)
		}
	}
	pastikanAkun("Admin InviLab", "admin@invilab.test", "admin123", "admin")
	pastikanAkun("Anggota InviLab", "anggota@invilab.test", "anggota123", "anggota")
```

Tambahkan blok peminjaman contoh tepat sebelum kurung tutup `func Run` (akhir file):

**Path:** `backend/internal/seed/seed.go`

```go
	kemarin := time.Now().AddDate(0, 0, -1)
	db.Create(&model.Peminjaman{
		BarangID: barang[0].ID, NamaPeminjam: "Budi Santoso", NIM: "H1H024050",
		TanggalPinjam: kemarin, Status: "Dipinjam",
	})
	db.Create(&model.Peminjaman{
		BarangID: barang[2].ID, NamaPeminjam: "Siti Rahma", NIM: "H1H024051",
		TanggalPinjam: kemarin, Status: "Dipinjam",
	})
```

Catatan: seed peminjaman memakai `barang[0].ID` dan `barang[2].ID` dari seed barang jobdesk-1. Di tahap ini baris barang belum masuk basis data (seed kategori baru masuk di jobdesk-3), jadi peminjaman contoh gagal masuk secara diam-diam dan `GET /api/peminjaman` masih kosong. Itu normal; peminjaman contoh terisi setelah jobdesk-3 push ke main.

## Langkah 7 - Verifikasi backend

```bash
cd backend
go build ./...
go vet ./...
go run ./cmd/api   # API jalan di http://localhost:3000
```

Cek dengan curl (ganti `TOKEN_ADMIN` dan `TOKEN_ANGGOTA` dengan token dari login):

```bash
# Registrasi (role di body diabaikan, akun baru selalu anggota)
curl -s -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nama":"Uji Coba","email":"uji@invilab.test","password":"uji12345","role":"admin"}'
# {"success":true,"message":"Akun berhasil dibuat, silakan login.","data":{"id":3,"nama":"Uji Coba","email":"uji@invilab.test","role":"anggota"}}

# Login admin demo
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@invilab.test","password":"admin123"}'
# {"success":true,"message":"Login berhasil.","data":{"token":"...","user":{"id":1,"nama":"Admin InviLab","email":"admin@invilab.test","role":"admin"}}}

# Login anggota demo
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"anggota@invilab.test","password":"anggota123"}'

# Profil (pakai token)
curl -s http://localhost:3000/api/auth/profile -H "Authorization: Bearer TOKEN_ADMIN"
# {"success":true,"message":"Profil ditemukan.","data":{"id":1,"nama":"Admin InviLab","email":"admin@invilab.test","role":"admin"}}

# Tanpa token dijawab 401
curl -s http://localhost:3000/api/barang
# {"success":false,"message":"Token tidak ditemukan, silakan login dulu."}

# Anggota menulis barang dijawab 403
curl -s -X POST http://localhost:3000/api/barang \
  -H "Authorization: Bearer TOKEN_ANGGOTA" -H "Content-Type: application/json" \
  -d '{"kode_barang":"BRG-009","nama":"Uji","kategori_id":1,"jumlah":1,"kondisi":"Baik","lokasi":"Lab A"}'
# {"success":false,"message":"Akses ditolak, role kamu tidak punya hak untuk ini."}

# Daftar peminjaman (masih kosong di tahap ini, itu normal)
curl -s "http://localhost:3000/api/peminjaman?page=1&limit=10" -H "Authorization: Bearer TOKEN_ADMIN"
# {"success":true,"message":"Daftar peminjaman ditemukan.","data":{"items":[],"pagination":{"page":1,"limit":10,"total":0,"total_page":1}}}

# Buat peminjaman tanpa barang dijawab 422 (baris barang baru ada setelah jobdesk-3)
curl -s -X POST http://localhost:3000/api/peminjaman \
  -H "Authorization: Bearer TOKEN_ANGGOTA" -H "Content-Type: application/json" \
  -d '{"barang_id":1,"nama_peminjam":"Budi Santoso","nim":"H1H024050","tanggal_pinjam":"2026-11-27"}'
# {"success":false,"message":"Barang tidak ditemukan."}
```

## Langkah 8 - Klien API + AuthContext

Klien `api()` mengirim token JWT dan menangani 401 (sesi dihapus, lempar ke `/login`). `AuthContext` menyimpan sesi di `localStorage`. Jangan ubah signature-nya (kontrak di `inisialisasi.md` bagian 3.5). **Commit:** `feat: klien API + AuthContext` → push boleh.

**Path:** `frontend/src/lib/api.js`

```js
// Klien API InviLab: fetch + token JWT + penanganan 401.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function ambilToken() {
  return localStorage.getItem("token");
}

export function simpanSesi(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function hapusSesi() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function penggunaSaatIni() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// Kalau server menjawab 401, sesi dianggap habis: token dihapus dan
// pengguna dilempar ke halaman login.
export async function api(path, options = {}) {
  const token = ambilToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(API_URL + path, { ...options, headers });
  if (res.status === 401) {
    hapusSesi();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Sesi habis, silakan login lagi.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Terjadi kesalahan.");
  return data;
}
```

**Path:** `frontend/src/context/AuthContext.jsx`

```jsx
import { createContext, useContext, useState } from "react";
import { api, hapusSesi, penggunaSaatIni, simpanSesi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(penggunaSaatIni);

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    simpanSesi(data.data.token, data.data.user);
    setUser(data.data.user);
  }

  async function register(nama, email, password) {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nama, email, password }),
    });
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Token sudah tidak valid pun tetap keluar.
    }
    hapusSesi();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
```

## Langkah 9 - Halaman login + registrasi

**Commit:** `feat: halaman login + registrasi` → push boleh.

**Path:** `frontend/src/pages/Login.jsx`

```jsx
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Pesan, inputCls, labelCls, tombolPrimer } from "../components/ui";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  if (user) return <Navigate to="/barang" replace />;

  async function kirim(e) {
    e.preventDefault();
    setPesan("");
    setMemuat(true);
    try {
      await login(email.trim(), password);
      navigate("/barang", { replace: true });
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">InviLab</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inventaris Laboratorium. Masuk untuk lanjut.
        </p>
        <div className="mt-4">
          <Pesan teks={pesan} gagal />
        </div>
        <form onSubmit={kirim} className="space-y-4">
          <div>
            <label htmlFor="email" className={labelCls}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={memuat} className={`${tombolPrimer} w-full`}>
            {memuat ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-700 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
```

**Path:** `frontend/src/pages/Register.jsx`

```jsx
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Pesan, inputCls, labelCls, tombolPrimer } from "../components/ui";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [gagal, setGagal] = useState(false);
  const [memuat, setMemuat] = useState(false);

  if (user) return <Navigate to="/barang" replace />;

  async function kirim(e) {
    e.preventDefault();
    setPesan("");
    setGagal(false);
    setMemuat(true);
    try {
      await register(nama.trim(), email.trim(), password);
      setPesan("Akun berhasil dibuat, silakan masuk.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Daftar akun</h1>
        <p className="mt-1 text-sm text-slate-500">
          Akun baru otomatis berperan sebagai anggota.
        </p>
        <div className="mt-4">
          <Pesan teks={pesan} gagal={gagal} />
        </div>
        <form onSubmit={kirim} className="space-y-4">
          <div>
            <label htmlFor="nama" className={labelCls}>
              Nama
            </label>
            <input
              id="nama"
              type="text"
              required
              minLength={3}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Kata sandi (minimal 6 karakter)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={memuat} className={`${tombolPrimer} w-full`}>
            {memuat ? "Memproses..." : "Daftar"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
```

## Langkah 10 - Halaman profil

**Commit:** `feat: halaman profil` → push boleh.

**Path:** `frontend/src/pages/Profile.jsx`

```jsx
import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Badge, Pesan, tombolHapus } from "../components/ui";

export default function Profile() {
  const { logout } = useAuth();
  const [profil, setProfil] = useState(null);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    api("/api/auth/profile")
      .then((data) => setProfil(data.data))
      .catch((err) => setPesan(err.message));
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Profil Saya</h2>
      <Pesan teks={pesan} gagal />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {profil ? (
          <>
            <p className="py-1">
              <strong>Nama:</strong> {profil.nama}
            </p>
            <p className="py-1">
              <strong>Email:</strong> {profil.email}
            </p>
            <p className="py-1">
              <strong>Role:</strong>{" "}
              <Badge warna={profil.role === "admin" ? "biru" : "abu"}>{profil.role}</Badge>
            </p>
          </>
        ) : (
          <p className="text-slate-500">Memuat...</p>
        )}
        <div className="mt-6">
          <button onClick={logout} className={tombolHapus}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Langkah 11 - Halaman Daftar Peminjaman

Filter status, tabel dengan Preload barang, tombol `Tandai kembali` (admin, hanya untuk status Dipinjam), ubah dan hapus (admin saja, hapus pakai popup `Konfirmasi` dari `ui.jsx` milik jobdesk-3). **Commit:** `feat: halaman Daftar Peminjaman` → push boleh.

**Path:** `frontend/src/pages/Peminjaman.jsx`

```jsx
import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  Konfirmasi,
  Pagination,
  Pesan,
  inputCls,
  labelCls,
  tombolHapus,
  tombolKecil,
  tombolPrimer,
  usePesanState,
} from "../components/ui";

function tanggal(iso) {
  return iso ? iso.slice(0, 10) : "-";
}

const BATAS = 10;

export default function Peminjaman() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const { pesan, setPesan, gagal, setGagal } = usePesanState();
  const [daftar, setDaftar] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [hapusTarget, setHapusTarget] = useState(null);

  const muat = useCallback(
    async (hal = 1) => {
      setMemuat(true);
      try {
        const data = await api(`/api/peminjaman?page=${hal}&limit=${BATAS}&status=${filterStatus}`);
        setDaftar(data.data.items || []);
        setHalaman(data.data.pagination.page);
        setTotalHalaman(data.data.pagination.total_page);
        setTotal(data.data.pagination.total);
      } catch (err) {
        setPesan(err.message);
        setGagal(true);
      } finally {
        setMemuat(false);
      }
    },
    [filterStatus, setPesan, setGagal]
  );

  useEffect(() => {
    muat(1);
  }, [muat]);

  async function tandaiKembali(p) {
    const hariIni = new Date().toISOString().slice(0, 10);
    try {
      await api(`/api/peminjaman/${p.id}`, {
        method: "PUT",
        body: JSON.stringify({
          barang_id: p.barang_id,
          nama_peminjam: p.nama_peminjam,
          nim: p.nim,
          tanggal_pinjam: tanggal(p.tanggal_pinjam),
          tanggal_kembali: hariIni,
          status: "Dikembalikan",
        }),
      });
      setPesan("Peminjaman ditandai sudah dikembalikan.");
      setGagal(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  async function hapus(id) {
    try {
      await api(`/api/peminjaman/${id}`, { method: "DELETE" });
      setPesan("Peminjaman berhasil dihapus.");
      setGagal(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Daftar Peminjaman</h2>
        <Link to="/peminjaman/tambah" className={tombolPrimer}>
          Pinjam Barang
        </Link>
      </div>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-w-xs">
          <label htmlFor="filter-status" className={labelCls}>
            Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputCls}
          >
            <option value="">Semua</option>
            <option>Dipinjam</option>
            <option>Dikembalikan</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2">Barang</th>
                <th className="px-3 py-2">Peminjam</th>
                <th className="px-3 py-2">NIM</th>
                <th className="px-3 py-2">Tgl Pinjam</th>
                <th className="px-3 py-2">Tgl Kembali</th>
                <th className="px-3 py-2">Status</th>
                {sayaAdmin && <th className="px-3 py-2 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {memuat ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Memuat...
                  </td>
                </tr>
              ) : daftar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Belum ada peminjaman.
                  </td>
                </tr>
              ) : (
                daftar.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{p.barang ? p.barang.nama : "-"}</td>
                    <td className="px-3 py-2">{p.nama_peminjam}</td>
                    <td className="px-3 py-2">{p.nim}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{tanggal(p.tanggal_pinjam)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{tanggal(p.tanggal_kembali)}</td>
                    <td className="px-3 py-2">
                      <Badge warna={p.status === "Dipinjam" ? "biru" : "hijau"}>{p.status}</Badge>
                    </td>
                    {sayaAdmin && (
                      <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                        <Link to={`/peminjaman/${p.id}/ubah`} className={tombolKecil}>
                          Ubah
                        </Link>
                        {p.status === "Dipinjam" && (
                          <button onClick={() => tandaiKembali(p)} className={tombolKecil}>
                            Tandai kembali
                          </button>
                        )}
                        <button onClick={() => setHapusTarget(p)} className={tombolHapus}>
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          halaman={halaman}
          totalHalaman={totalHalaman}
          total={total}
          batas={BATAS}
          satuan="peminjaman"
          onPindah={muat}
        />
      </div>

      <Konfirmasi
        terbuka={Boolean(hapusTarget)}
        judul="Hapus Peminjaman"
        pesan={
          hapusTarget
            ? `Hapus peminjaman ${hapusTarget.nama_peminjam} (${hapusTarget.barang ? hapusTarget.barang.nama : ""})? Tindakan ini tidak bisa dibatalkan.`
            : ""
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => {
          const id = hapusTarget.id;
          setHapusTarget(null);
          hapus(id);
        }}
      />
    </div>
  );
}
```

## Langkah 12 - Halaman form Peminjaman

Form pinjam barang (semua role yang sudah login) dan ubah peminjaman (admin saja, dengan tanggal kembali + status). Dropdown barang memuat dari `GET /api/barang?page=1&limit=100`; dropdown masih kosong sampai seed barang terisi setelah jobdesk-3 push ke main. **Commit:** `feat: halaman form Peminjaman` → push boleh.

**Path:** `frontend/src/pages/PeminjamanForm.jsx`

```jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pesan, inputCls, labelCls, tombolHantu, tombolPrimer } from "../components/ui";

function tanggal(iso) {
  return iso ? iso.slice(0, 10) : "";
}

const formAwal = {
  barang_id: "",
  nama_peminjam: "",
  nim: "",
  tanggal_pinjam: "",
  tanggal_kembali: "",
  status: "Dipinjam",
};

export default function PeminjamanForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [barang, setBarang] = useState([]);
  const [form, setForm] = useState(formAwal);
  const [memuat, setMemuat] = useState(edit);
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    api("/api/barang?page=1&limit=100")
      .then((data) => setBarang(data.data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!edit) return;
    api(`/api/peminjaman/${id}`)
      .then((data) => {
        const p = data.data;
        setForm({
          barang_id: String(p.barang_id),
          nama_peminjam: p.nama_peminjam,
          nim: p.nim,
          tanggal_pinjam: tanggal(p.tanggal_pinjam),
          tanggal_kembali: tanggal(p.tanggal_kembali),
          status: p.status,
        });
      })
      .catch((err) => setPesan(err.message))
      .finally(() => setMemuat(false));
  }, [edit, id]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setMenyimpan(true);
    try {
      if (edit) {
        const isi = {
          barang_id: parseInt(form.barang_id, 10),
          nama_peminjam: form.nama_peminjam.trim(),
          nim: form.nim.trim(),
          tanggal_pinjam: form.tanggal_pinjam,
          tanggal_kembali: form.tanggal_kembali || null,
          status: form.status,
        };
        await api(`/api/peminjaman/${id}`, { method: "PUT", body: JSON.stringify(isi) });
        navigate("/peminjaman", { state: { pesan: "Peminjaman berhasil disimpan." } });
      } else {
        const isi = {
          barang_id: parseInt(form.barang_id, 10),
          nama_peminjam: form.nama_peminjam.trim(),
          nim: form.nim.trim(),
          tanggal_pinjam: form.tanggal_pinjam,
        };
        await api("/api/peminjaman", { method: "POST", body: JSON.stringify(isi) });
        navigate("/peminjaman", { state: { pesan: "Peminjaman berhasil dibuat." } });
      }
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{edit ? "Ubah Peminjaman" : "Pinjam Barang"}</h2>
        <Link to="/peminjaman" className={tombolHantu}>
          Kembali ke daftar
        </Link>
      </div>
      <Pesan teks={pesan} gagal />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {memuat ? (
          <p className="py-6 text-center text-slate-500">Memuat...</p>
        ) : (
          <form onSubmit={simpan} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="barang" className={labelCls}>
                  Barang
                </label>
                <select
                  id="barang"
                  required
                  value={form.barang_id}
                  onChange={(e) => setForm({ ...form, barang_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Pilih barang</option>
                  {barang.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.nama} ({b.kode_barang})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="nama-peminjam" className={labelCls}>
                  Nama peminjam
                </label>
                <input
                  id="nama-peminjam"
                  required
                  value={form.nama_peminjam}
                  onChange={(e) => setForm({ ...form, nama_peminjam: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="nim" className={labelCls}>
                  NIM
                </label>
                <input
                  id="nim"
                  required
                  value={form.nim}
                  onChange={(e) => setForm({ ...form, nim: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="tanggal-pinjam" className={labelCls}>
                  Tanggal pinjam
                </label>
                <input
                  id="tanggal-pinjam"
                  type="date"
                  required
                  value={form.tanggal_pinjam}
                  onChange={(e) => setForm({ ...form, tanggal_pinjam: e.target.value })}
                  className={inputCls}
                />
              </div>
              {edit && (
                <>
                  <div>
                    <label htmlFor="tanggal-kembali" className={labelCls}>
                      Tanggal kembali
                    </label>
                    <input
                      id="tanggal-kembali"
                      type="date"
                      value={form.tanggal_kembali}
                      onChange={(e) => setForm({ ...form, tanggal_kembali: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className={labelCls}>
                      Status
                    </label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputCls}
                    >
                      <option>Dipinjam</option>
                      <option>Dikembalikan</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate("/peminjaman")} className={tombolHantu}>
                Batal
              </button>
              <button type="submit" disabled={menyimpan} className={tombolPrimer}>
                {menyimpan ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

## Checklist serah terima

- [ ] `go build ./...` dan `go vet ./...` hijau di folder `backend/`
- [ ] Registrasi dengan `role: admin` di body tetap membuat akun anggota
- [ ] Login admin demo dan anggota demo mengembalikan JWT + `user.role` yang benar
- [ ] `GET /api/auth/profile` dengan token menjawab 200
- [ ] Tanpa token dijawab 401; anggota `POST /api/barang` dijawab 403
- [ ] `GET /api/peminjaman` menjawab bentuk pagination `{items, pagination{page, limit, total, total_page}}`
- [ ] Halaman Login, Register, Profile, Peminjaman, PeminjamanForm mengikuti kontrak `api()`, `useAuth()`, dan `ui.jsx` di `inisialisasi.md`
- [ ] Semua langkah sudah di-push langsung ke `main`
