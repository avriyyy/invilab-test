# jobdesk-1 - Fondasi Backend & CRUD Barang

**CRUD milikmu (backend + halaman): Barang**

**Cara kerja:** langsung di branch `main`, tidak buat branch baru (`git pull` dulu sebelum mulai, commit + push langsung ke `main` setelah tiap langkah lolos cek).

Kamu membangun fondasi backend (config, format respons, model, router, seed) dan CRUD Barang end-to-end. Baca `inisialisasi.md` dulu, terutama kontrak di bagian 3.

## Langkah 1 - Fondasi backend: go.mod, config, respons, env

Module Go, konfigurasi dari environment, dan helper format respons + pagination. Helper ini dipakai semua handler, jadi jangan ubah signature-nya (kontrak di `inisialisasi.md` bagian 3.4). **Commit:** `chore: fondasi backend (config + respons + env)` → push boleh.

**Path:** `backend/go.mod`

```go
module invilab

go 1.26.0

require (
	github.com/go-playground/validator/v10 v10.30.6
	github.com/gofiber/fiber/v3 v3.7.0
	github.com/golang-jwt/jwt/v5 v5.3.0
	github.com/joho/godotenv v1.5.1
	golang.org/x/crypto v0.58.0
	gorm.io/driver/mysql v1.6.0
	gorm.io/gorm v1.31.2
)

require (
	filippo.io/edwards25519 v1.1.0 // indirect
	github.com/gabriel-vasile/mimetype v1.4.16 // indirect
	github.com/go-playground/locales v0.14.2 // indirect
	github.com/go-playground/universal-translator v0.18.2 // indirect
	github.com/go-sql-driver/mysql v1.8.1 // indirect
	github.com/gofiber/schema v1.9.3 // indirect
	github.com/gofiber/utils/v2 v2.6.4 // indirect
	github.com/google/uuid v1.6.0 // indirect
	github.com/jinzhu/inflection v1.0.0 // indirect
	github.com/jinzhu/now v1.1.5 // indirect
	github.com/klauspost/compress v1.20.3 // indirect
	github.com/leodido/go-urn v1.5.0 // indirect
	github.com/mattn/go-colorable v0.1.16 // indirect
	github.com/mattn/go-isatty v0.0.24 // indirect
	github.com/molecule-man/go-brrr v1.3.1 // indirect
	github.com/philhofer/fwd v1.2.1 // indirect
	github.com/tinylib/msgp v1.6.5 // indirect
	github.com/valyala/bytebufferpool v1.0.0 // indirect
	github.com/valyala/fasthttp v1.78.0 // indirect
	golang.org/x/net v0.62.0 // indirect
	golang.org/x/sys v0.49.0 // indirect
	golang.org/x/text v0.43.0 // indirect
)
```

Jalankan `go mod tidy` untuk membuat `backend/go.sum` (file lock dibuat otomatis, jangan ditulis manual).

**Path:** `backend/internal/config/config.go`

```go
package config

import (
	"os"
)

// Config menampung semua konfigurasi aplikasi yang dibaca dari environment variable.
type Config struct {
	DBHost     string
	DBPort     string
	DBUser     string
	DBPassword string
	DBName     string
	JWTSecret  string
	Port       string
	Frontend   string
}

func getenv(key, def string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return def
}

// Load membaca konfigurasi dari environment variable.
// PORT dibaca duluan karena sebagian hosting memakai PORT, bukan APP_PORT.
func Load() Config {
	port := os.Getenv("PORT")
	if port == "" {
		port = getenv("APP_PORT", "3000")
	}
	return Config{
		DBHost:     getenv("DB_HOST", "127.0.0.1"),
		DBPort:     getenv("DB_PORT", "3306"),
		DBUser:     getenv("DB_USER", "root"),
		DBPassword: getenv("DB_PASSWORD", ""),
		DBName:     getenv("DB_NAME", "invilab"),
		JWTSecret:  getenv("JWT_SECRET", ""),
		Port:       port,
		Frontend:   getenv("FRONTEND_URL", "http://localhost:5173"),
	}
}
```

**Path:** `backend/internal/handler/response.go`

```go
package handler

import (
	"strconv"

	"github.com/go-playground/validator/v10"
	"github.com/gofiber/fiber/v3"
)

var validate = validator.New()

// Sukses mengirim respons berhasil dengan format yang konsisten.
func Sukses(c fiber.Ctx, status int, pesan string, data interface{}) error {
	return c.Status(status).JSON(fiber.Map{
		"success": true,
		"message": pesan,
		"data":    data,
	})
}

// Gagal mengirim respons error. Detail error internal tidak dikirim ke klien.
func Gagal(c fiber.Ctx, status int, pesan string) error {
	return c.Status(status).JSON(fiber.Map{
		"success": false,
		"message": pesan,
	})
}

// Validasi memeriksa struct request dengan validator.
// Kalau tidak valid, dijawab 422 beserta pesan dalam bahasa Indonesia.
func Validasi(c fiber.Ctx, req interface{}) bool {
	if err := validate.Struct(req); err != nil {
		pesan := "Data tidak valid."
		if errs, ok := err.(validator.ValidationErrors); ok && len(errs) > 0 {
			pesan = pesanValidasi(errs[0])
		}
		_ = Gagal(c, fiber.StatusUnprocessableEntity, pesan)
		return false
	}
	return true
}

// pesanValidasi mengubah satu validation error jadi pesan bahasa Indonesia.
func pesanValidasi(e validator.FieldError) string {
	nama := e.Field()
	switch e.Tag() {
	case "required":
		return nama + " wajib diisi."
	case "email":
		return "Format email tidak valid."
	case "min":
		return nama + " terlalu pendek."
	case "max":
		return nama + " terlalu panjang."
	case "oneof":
		return nama + " nilainya tidak valid."
	default:
		return "Data " + nama + " tidak valid."
	}
}

// Pagination membaca query page dan limit, dengan nilai aman kalau tidak diisi.
func Pagination(c fiber.Ctx) (page, limit, offset int) {
	page, _ = strconv.Atoi(c.Query("page", "1"))
	limit, _ = strconv.Atoi(c.Query("limit", "10"))
	if page < 1 {
		page = 1
	}
	if limit < 1 || limit > 100 {
		limit = 10
	}
	offset = (page - 1) * limit
	return page, limit, offset
}

// MetaPagination dipakai di respons daftar supaya frontend bisa bikin halaman.
func MetaPagination(page, limit int, total int64) fiber.Map {
	totalPage := int(total) / limit
	if int(total)%limit != 0 {
		totalPage++
	}
	if totalPage < 1 {
		totalPage = 1
	}
	return fiber.Map{
		"page":       page,
		"limit":      limit,
		"total":      total,
		"total_page": totalPage,
	}
}
```

**Path:** `backend/.env.example`

```
APP_PORT=3000
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=invilab
# Wajib diganti dengan nilai acak yang panjang, jangan pakai nilai contoh.
JWT_SECRET=ganti-dengan-nilai-acak-yang-panjang
FRONTEND_URL=http://localhost:8080
```

Buat `.env` sendiri dari contoh (jangan di-commit):

```bash
cp backend/.env.example backend/.env
# isi DB_PASSWORD dan JWT_SECRET di backend/.env
# JWT_SECRET: nilai acak yang panjang, contoh: openssl rand -hex 32
```

**Path:** `backend/.dockerignore`

```
.env
*.log
```

**Path:** `docker-compose.yml`

```yaml
services:
  db:
    image: mysql:8.0
    container_name: invilab-db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: invilab
    ports:
      - "3306:3306"
    volumes:
      - invilab-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  invilab-db-data:
```

```bash
docker compose up -d db   # MySQL lokal di 127.0.0.1:3306, database invilab
```

## Langkah 2 - Model Barang + kerangka models.go

File `models.go` adalah file bersama. Kamu menulis kerangkanya + model Barang + struct Kategori + struct Peminjaman. Struct Kategori dan Peminjaman ikut ditulis di sini (bukan di jobdesk-3/jobdesk-2) karena kode jobdesk-1 sudah memakai tipenya: `Barang` punya foreign key ke `Kategori`, dan guard hapus Barang mengecek tabel peminjaman; tipenya harus sudah ada supaya backend bisa di-build dan jalan di tahap ini. CRUD Kategori dan CRUD Peminjaman (handler, route, halaman) tetap milik jobdesk-3 dan jobdesk-2. Jobdesk-2 menambahkan struct User dan request auth + peminjaman di titik yang ditandai di bawah. Jobdesk-3 menambahkan request kategori. Jangan tulis model lain di file ini. **Commit:** `feat: model Barang + Kategori + Peminjaman` → push boleh.

**Path:** `backend/internal/model/models.go`

```go
package model

import (
	"time"

	"gorm.io/gorm"
)

// Kategori mengelompokkan barang. Satu kategori punya banyak barang.
type Kategori struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Nama      string         `gorm:"size:100;uniqueIndex;not null" json:"nama"`
	Deskripsi string         `gorm:"size:255" json:"deskripsi"`
	Barang    []Barang       `gorm:"foreignKey:KategoriID" json:"barang,omitempty"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

// Barang adalah barang inventaris laboratorium.
type Barang struct {
	ID         uint           `gorm:"primaryKey" json:"id"`
	KodeBarang string         `gorm:"size:50;uniqueIndex;not null" json:"kode_barang"`
	Nama       string         `gorm:"size:150;not null" json:"nama"`
	KategoriID uint           `gorm:"not null;index" json:"kategori_id"`
	Kategori   Kategori       `gorm:"foreignKey:KategoriID" json:"kategori"`
	Jumlah     int            `gorm:"not null;default:0" json:"jumlah"`
	Kondisi    string         `gorm:"size:20;not null;default:Baik" json:"kondisi"`
	Lokasi     string         `gorm:"size:100" json:"lokasi"`
	CreatedAt  time.Time      `json:"created_at"`
	UpdatedAt  time.Time      `json:"updated_at"`
	DeletedAt  gorm.DeletedAt `gorm:"index" json:"-"`
}

// Peminjaman mencatat peminjaman satu barang oleh satu peminjam.
type Peminjaman struct {
	ID             uint           `gorm:"primaryKey" json:"id"`
	BarangID       uint           `gorm:"not null;index" json:"barang_id"`
	Barang         Barang         `gorm:"foreignKey:BarangID" json:"barang"`
	NamaPeminjam   string         `gorm:"size:100;not null" json:"nama_peminjam"`
	NIM            string         `gorm:"size:20;not null" json:"nim"`
	TanggalPinjam  time.Time      `gorm:"not null" json:"tanggal_pinjam"`
	TanggalKembali *time.Time     `json:"tanggal_kembali"`
	Status         string         `gorm:"size:20;not null;default:Dipinjam" json:"status"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`
}

type BarangRequest struct {
	KodeBarang string `json:"kode_barang" validate:"required,min=2,max=50"`
	Nama       string `json:"nama" validate:"required,min=2,max=150"`
	KategoriID uint   `json:"kategori_id" validate:"required"`
	Jumlah     int    `json:"jumlah" validate:"min=0"`
	Kondisi    string `json:"kondisi" validate:"required,oneof=Baik Rusak Perawatan"`
	Lokasi     string `json:"lokasi" validate:"max=100"`
}
```

Titik sisip untuk jobdesk lain (jangan diisi sekarang, hanya penanda):

- Struct `User` (jobdesk-2) disisipkan tepat sebelum komentar `// Kategori mengelompokkan barang.` (struct Kategori sudah ada di file ini, ditulis jobdesk-1).
- Request `RegisterRequest`, `LoginRequest` (jobdesk-2) disisipkan tepat sebelum `type BarangRequest struct {`, dan `PeminjamanRequest` (jobdesk-2) ditambahkan di akhir file.
- Request `KategoriRequest` (jobdesk-3) disisipkan tepat sebelum `type BarangRequest struct {`, setelah `LoginRequest`.

## Langkah 3 - CRUD Barang

Handler lengkap: daftar dengan pagination + pencarian (`?search=` dicocokkan ke nama dan kode barang), detail dengan Preload kategori, tambah, ubah, hapus. Barang yang masih dipinjam (status Dipinjam) tidak bisa dihapus. **Commit:** `feat: CRUD Barang + pagination + pencarian` → push boleh.

**Path:** `backend/internal/handler/barang_handler.go`

```go
package handler

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/model"
)

// BarangHandler menangani CRUD barang.
type BarangHandler struct {
	DB *gorm.DB
}

func NewBarangHandler(db *gorm.DB) *BarangHandler {
	return &BarangHandler{DB: db}
}

// List mengembalikan daftar barang dengan pagination dan pencarian.
// Pencarian memakai query ?search= yang dicocokkan ke nama dan kode barang.
func (h *BarangHandler) List(c fiber.Ctx) error {
	page, limit, offset := Pagination(c)
	cari := c.Query("search", "")

	q := h.DB.Model(&model.Barang{}).Preload("Kategori")
	if cari != "" {
		pola := "%" + cari + "%"
		q = q.Where("nama LIKE ? OR kode_barang LIKE ?", pola, pola)
	}

	var total int64
	q.Count(&total)

	var daftar []model.Barang
	if err := q.Order("nama ASC").Limit(limit).Offset(offset).Find(&daftar).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal mengambil data barang.")
	}
	return Sukses(c, fiber.StatusOK, "Daftar barang ditemukan.", fiber.Map{
		"items":      daftar,
		"pagination": MetaPagination(page, limit, total),
	})
}

// Detail mengembalikan satu barang beserta kategorinya.
func (h *BarangHandler) Detail(c fiber.Ctx) error {
	id := c.Params("id")
	var barang model.Barang
	if err := h.DB.Preload("Kategori").First(&barang, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Barang tidak ditemukan.")
	}
	return Sukses(c, fiber.StatusOK, "Barang ditemukan.", barang)
}

// Create menambah barang baru. Hanya admin.
func (h *BarangHandler) Create(c fiber.Ctx) error {
	var req model.BarangRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	var kategori model.Kategori
	if err := h.DB.First(&kategori, req.KategoriID).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Kategori tidak ditemukan.")
	}

	barang := model.Barang{
		KodeBarang: req.KodeBarang,
		Nama:       req.Nama,
		KategoriID: req.KategoriID,
		Jumlah:     req.Jumlah,
		Kondisi:    req.Kondisi,
		Lokasi:     req.Lokasi,
	}
	if err := h.DB.Create(&barang).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Kode barang sudah dipakai.")
	}
	h.DB.Preload("Kategori").First(&barang, barang.ID)
	return Sukses(c, fiber.StatusCreated, "Barang berhasil ditambah.", barang)
}

// Update mengubah barang. Hanya admin.
func (h *BarangHandler) Update(c fiber.Ctx) error {
	id := c.Params("id")
	var barang model.Barang
	if err := h.DB.First(&barang, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Barang tidak ditemukan.")
	}

	var req model.BarangRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	var kategori model.Kategori
	if err := h.DB.First(&kategori, req.KategoriID).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Kategori tidak ditemukan.")
	}

	barang.KodeBarang = req.KodeBarang
	barang.Nama = req.Nama
	barang.KategoriID = req.KategoriID
	barang.Jumlah = req.Jumlah
	barang.Kondisi = req.Kondisi
	barang.Lokasi = req.Lokasi
	if err := h.DB.Save(&barang).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Kode barang sudah dipakai.")
	}
	h.DB.Preload("Kategori").First(&barang, barang.ID)
	return Sukses(c, fiber.StatusOK, "Barang berhasil diubah.", barang)
}

// Delete menghapus barang. Hanya admin. Barang yang masih
// dipinjam (status Dipinjam) tidak bisa dihapus.
func (h *BarangHandler) Delete(c fiber.Ctx) error {
	id := c.Params("id")
	var barang model.Barang
	if err := h.DB.First(&barang, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Barang tidak ditemukan.")
	}

	var jumlah int64
	h.DB.Model(&model.Peminjaman{}).Where("barang_id = ? AND status = ?", id, "Dipinjam").Count(&jumlah)
	if jumlah > 0 {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Barang masih dipinjam, tidak bisa dihapus.")
	}

	if err := h.DB.Delete(&barang).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal menghapus barang.")
	}
	return Sukses(c, fiber.StatusOK, "Barang berhasil dihapus.", nil)
}
```

## Langkah 4 - Router + main + seed barang

Router kerangka: cek status + route barang. Catatan: route di langkah ini belum dilindungi middleware autentikasi, karena middleware milik jobdesk-2. Endpoint bisa dipanggil tanpa token di tahap ini. Jobdesk-2 memasang middleware di router (Langkah 5 jobdesk-2); setelah itu tanpa token dijawab 401 dan anggota yang menulis dijawab 403. **Commit:** `feat: router + main + seed barang` → push boleh.

**Path:** `backend/internal/router/router.go`

```go
package router

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/handler"
)

// Setup mendaftarkan semua route API.
// Urutan middleware penting: pengecekan role ditulis SEBELUM handler,
// karena Fiber v3 menjalankan handler sesuai urutan penulisan.
func Setup(app *fiber.App, db *gorm.DB, jwtSecret string) {
	barang := handler.NewBarangHandler(db)

	api := app.Group("/api")

	// Cek status, dipakai untuk memastikan API hidup saat deployment.
	api.Get("/status", func(c fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"success": true,
			"message": "InviLab API berjalan.",
		})
	})

	// Barang: baca boleh semua role, tulis hanya admin.
	b := api.Group("/barang")
	b.Get("/", barang.List)
	b.Get("/:id", barang.Detail)
	b.Post("/", barang.Create)
	b.Put("/:id", barang.Update)
	b.Delete("/:id", barang.Delete)

}
```

Titik sisip untuk jobdesk lain (jangan diisi sekarang, hanya penanda):

- Jobdesk-2 menambahkan route `/api/auth` + `/api/peminjaman`, memasang middleware `Autentikasi` dan `HanyaPeran("admin")` di semua grup resource, dan menambahkan import middleware.
- Jobdesk-3 menambahkan route `/api/kategori` tepat sebelum grup barang.

**Path:** `backend/cmd/api/main.go`

```go
package main

import (
	"fmt"
	"log"
	"strings"

	"github.com/gofiber/fiber/v3"
	"github.com/gofiber/fiber/v3/middleware/cors"
	"github.com/gofiber/fiber/v3/middleware/logger"
	"github.com/gofiber/fiber/v3/middleware/recover"
	"github.com/joho/godotenv"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"invilab/internal/config"
	"invilab/internal/model"
	"invilab/internal/router"
	"invilab/internal/seed"
)

func originsCORS(frontend string) []string {
	origins := []string{frontend}
	if strings.Contains(frontend, "localhost") {
		origins = append(origins, strings.Replace(frontend, "localhost", "127.0.0.1", 1))
	}
	return origins
}

func main() {
	_ = godotenv.Load()

	cfg := config.Load()
	if cfg.JWTSecret == "" {
		log.Fatal("JWT_SECRET belum diisi. Isi di .env dengan nilai acak yang panjang.")
	}

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?charset=utf8mb4&parseTime=True&loc=Local",
		cfg.DBUser, cfg.DBPassword, cfg.DBHost, cfg.DBPort, cfg.DBName)
	db, err := gorm.Open(mysql.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatal("Gagal terhubung ke basis data: ", err)
	}

	if err := db.AutoMigrate(&model.Barang{}); err != nil {
		log.Fatal("Gagal migrasi: ", err)
	}
	seed.Run(db)

	app := fiber.New(fiber.Config{
		ErrorHandler: func(c fiber.Ctx, err error) error {
			code := fiber.StatusInternalServerError
			if e, ok := err.(*fiber.Error); ok {
				code = e.Code
			}
			return c.Status(code).JSON(fiber.Map{
				"success": false,
				"message": "Terjadi kesalahan di server.",
			})
		},
	})
	app.Use(recover.New())
	app.Use(logger.New())
	app.Use(cors.New(cors.Config{
		// Izinkan juga varian 127.0.0.1 dari origin yang sama.
		AllowOrigins:     originsCORS(cfg.Frontend),
		AllowHeaders:     []string{"Origin", "Content-Type", "Accept", "Authorization"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowCredentials: true,
	}))

	router.Setup(app, db, cfg.JWTSecret)

	log.Printf("InviLab API berjalan di port %s", cfg.Port)
	log.Fatal(app.Listen(":" + cfg.Port))
}
```

Perhatikan baris `db.AutoMigrate(&model.Barang{})`. Ini titik gabung: jobdesk-2 mengubahnya menjadi `db.AutoMigrate(&model.User{}, &model.Barang{}, &model.Peminjaman{})`, lalu jobdesk-3 mengubahnya menjadi `db.AutoMigrate(&model.User{}, &model.Kategori{}, &model.Barang{}, &model.Peminjaman{})`.

**Path:** `backend/internal/seed/seed.go`

```go
package seed

import (
	"gorm.io/gorm"

	"invilab/internal/model"
)

// Run mengisi data contoh barang kalau tabel barang masih kosong.
func Run(db *gorm.DB) {
	// Data contoh barang hanya diisi sekali, kalau tabel barang masih kosong.
	var jumlahBarang int64
	db.Model(&model.Barang{}).Count(&jumlahBarang)
	if jumlahBarang > 0 {
		return
	}

	barang := []model.Barang{
		{KodeBarang: "BRG-001", Nama: "Laptop Lenovo ThinkPad", KategoriID: 1, Jumlah: 5, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-002", Nama: "Kabel HDMI 2m", KategoriID: 4, Jumlah: 12, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-003", Nama: "Arduino Uno R3", KategoriID: 3, Jumlah: 8, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-004", Nama: "Multimeter Digital", KategoriID: 3, Jumlah: 6, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-005", Nama: "Router TP-Link", KategoriID: 4, Jumlah: 3, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-006", Nama: "Obeng Set 6 Pcs", KategoriID: 2, Jumlah: 10, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-007", Nama: "Proyektor Epson", KategoriID: 3, Jumlah: 2, Kondisi: "Perawatan", Lokasi: "Lab A"},
		{KodeBarang: "BRG-008", Nama: "Kabel LAN Cat6 5m", KategoriID: 4, Jumlah: 15, Kondisi: "Baik", Lokasi: "Lab A"},
	}
	for i := range barang {
		db.Create(&barang[i])
	}

}
```

Catatan seed: baris barang memakai `KategoriID` angka 1-4. Baris barang baru benar-benar masuk ke basis data setelah seed kategori dari jobdesk-3 di-push ke main, karena foreign key `kategori_id` menunjuk tabel kategoris. Sebelum itu, `GET /api/barang` mengembalikan daftar kosong dan `POST /api/barang` dijawab 422. Itu normal di tahap ini; checklist di bawah sudah memperhitungkannya. Jobdesk-2 menambahkan akun demo di awal `Run`, jobdesk-3 mengganti blok gate di atas dengan gate kategori + seed kategori.

## Langkah 5 - Dockerfile backend

**Path:** `backend/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
# Build context: folder backend/ (atur base directory ke /backend).
FROM golang:1.26-alpine AS build
WORKDIR /src
COPY go.mod go.sum ./
RUN go mod download
COPY . ./
RUN CGO_ENABLED=0 GOOS=linux go build -o /invilab-api ./cmd/api

FROM alpine:3.20
RUN apk add --no-cache ca-certificates curl
WORKDIR /app
COPY --from=build /invilab-api ./
EXPOSE 3000
CMD ["./invilab-api"]
```

Catatan: baris komentar tentang base directory di atas sudah dipersingkat di panduan ini (nama platform deployment tidak disebutkan). Isi kode lainnya sama persis dengan file di repo. **Commit:** `chore: Dockerfile backend` → push boleh.

## Langkah 6 - Verifikasi backend

```bash
cd backend
go build ./...
go vet ./...
go run ./cmd/api   # API jalan di http://localhost:3000
```

Cek dengan curl (di tahap ini tanpa token, karena middleware baru dipasang jobdesk-2):

```bash
curl -s http://localhost:3000/api/status
# {"success":true,"message":"InviLab API berjalan."}

curl -s "http://localhost:3000/api/barang?page=1&limit=10"
# {"success":true,"message":"Daftar barang ditemukan.","data":{"items":[],"pagination":{"page":1,"limit":10,"total":0,"total_page":1}}}
# Daftar masih kosong di tahap ini (seed kategori baru masuk di jobdesk-3). Itu normal.

curl -s -X POST http://localhost:3000/api/barang \
  -H "Content-Type: application/json" \
  -d '{"kode_barang":"BRG-001","nama":"Laptop Lenovo ThinkPad","kategori_id":1,"jumlah":5,"kondisi":"Baik","lokasi":"Lab A"}'
# {"success":false,"message":"Kategori tidak ditemukan."}
# 422 ini membuktikan guard kategori di handler Create bekerja.
```

## Langkah 7 - Halaman Daftar Barang

Halaman daftar memakai kontrak `api()` (jobdesk-2), `useAuth()` (jobdesk-2), dan komponen `ui.jsx` (jobdesk-3) dari `inisialisasi.md` bagian 3.5-3.6. Tulis mengikuti kontrak itu. Build frontend dicek di langkah integrasi jobdesk-3, karena `package.json` baru dibuat jobdesk-3. **Commit:** `feat: halaman Daftar Barang` → push boleh.

**Path:** `frontend/src/pages/Barang.jsx`

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

const warnaKondisi = { Baik: "hijau", Rusak: "merah", Perawatan: "kuning" };
const BATAS = 10;

export default function Barang() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const { pesan, setPesan, gagal, setGagal } = usePesanState();
  const [daftar, setDaftar] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [cari, setCari] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [hapusTarget, setHapusTarget] = useState(null);

  const muat = useCallback(
    async (hal = 1) => {
      setMemuat(true);
      try {
        const data = await api(
          `/api/barang?page=${hal}&limit=${BATAS}&search=${encodeURIComponent(cari)}`
        );
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
    [cari, setPesan, setGagal]
  );

  useEffect(() => {
    muat(1);
  }, [muat]);

  async function hapus(id) {
    try {
      await api(`/api/barang/${id}`, { method: "DELETE" });
      setPesan("Barang berhasil dihapus.");
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
        <h2 className="text-2xl font-bold">Daftar Barang</h2>
        {sayaAdmin && (
          <Link to="/barang/tambah" className={tombolPrimer}>
            Tambah Barang
          </Link>
        )}
      </div>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-52 flex-1">
            <label htmlFor="cari" className={labelCls}>
              Cari barang
            </label>
            <input
              id="cari"
              type="text"
              placeholder="Nama atau kode barang"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className={inputCls}
            />
          </div>
          <button onClick={() => muat(1)} className={tombolPrimer}>
            Cari
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2">Jumlah</th>
                <th className="px-3 py-2">Kondisi</th>
                <th className="px-3 py-2">Lokasi</th>
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
                    Belum ada barang.
                  </td>
                </tr>
              ) : (
                daftar.map((b) => (
                  <tr key={b.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{b.kode_barang}</td>
                    <td className="px-3 py-2">{b.nama}</td>
                    <td className="px-3 py-2">{b.kategori ? b.kategori.nama : "-"}</td>
                    <td className="px-3 py-2">{b.jumlah}</td>
                    <td className="px-3 py-2">
                      <Badge warna={warnaKondisi[b.kondisi]}>{b.kondisi}</Badge>
                    </td>
                    <td className="px-3 py-2">{b.lokasi || "-"}</td>
                    {sayaAdmin && (
                      <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                        <Link to={`/barang/${b.id}/ubah`} className={tombolKecil}>
                          Ubah
                        </Link>
                        <button onClick={() => setHapusTarget(b)} className={tombolHapus}>
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
          satuan="barang"
          onPindah={muat}
        />
      </div>

      <Konfirmasi
        terbuka={Boolean(hapusTarget)}
        judul="Hapus Barang"
        pesan={
          hapusTarget
            ? `Hapus ${hapusTarget.kode_barang} - ${hapusTarget.nama}? Tindakan ini tidak bisa dibatalkan.`
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

## Langkah 8 - Halaman form Barang

Form tambah dan ubah barang di satu file (mode tambah kalau tidak ada `:id` di URL, mode ubah kalau ada). Dropdown kategori memuat dari `GET /api/kategori?limit=100`; dropdown masih kosong sampai API kategori dari jobdesk-3 di-push ke main. Setelah simpan berhasil, kembali ke daftar dengan pesan sukses. **Commit:** `feat: halaman form Barang` → push boleh.

**Path:** `frontend/src/pages/BarangForm.jsx`

```jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pesan, inputCls, labelCls, tombolHantu, tombolPrimer } from "../components/ui";

const formAwal = { kode_barang: "", nama: "", kategori_id: "", jumlah: 1, kondisi: "Baik", lokasi: "" };

export default function BarangForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [kategori, setKategori] = useState([]);
  const [form, setForm] = useState(formAwal);
  const [memuat, setMemuat] = useState(edit);
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    api("/api/kategori?limit=100")
      .then((data) => setKategori(data.data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!edit) return;
    api(`/api/barang/${id}`)
      .then((data) => {
        const b = data.data;
        setForm({
          kode_barang: b.kode_barang,
          nama: b.nama,
          kategori_id: String(b.kategori_id),
          jumlah: b.jumlah,
          kondisi: b.kondisi,
          lokasi: b.lokasi || "",
        });
      })
      .catch((err) => setPesan(err.message))
      .finally(() => setMemuat(false));
  }, [edit, id]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setMenyimpan(true);
    const isi = {
      kode_barang: form.kode_barang.trim(),
      nama: form.nama.trim(),
      kategori_id: parseInt(form.kategori_id, 10),
      jumlah: parseInt(form.jumlah, 10),
      kondisi: form.kondisi,
      lokasi: form.lokasi.trim(),
    };
    try {
      if (edit) {
        await api(`/api/barang/${id}`, { method: "PUT", body: JSON.stringify(isi) });
      } else {
        await api("/api/barang", { method: "POST", body: JSON.stringify(isi) });
      }
      navigate("/barang", { state: { pesan: "Barang berhasil disimpan." } });
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{edit ? "Ubah Barang" : "Tambah Barang"}</h2>
        <Link to="/barang" className={tombolHantu}>
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
                <label htmlFor="kode" className={labelCls}>
                  Kode barang
                </label>
                <input
                  id="kode"
                  required
                  value={form.kode_barang}
                  onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="nama" className={labelCls}>
                  Nama
                </label>
                <input
                  id="nama"
                  required
                  value={form.nama}
                  onChange={(e) => setForm({ ...form, nama: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="kategori" className={labelCls}>
                  Kategori
                </label>
                <select
                  id="kategori"
                  required
                  value={form.kategori_id}
                  onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Pilih kategori</option>
                  {kategori.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="jumlah" className={labelCls}>
                  Jumlah
                </label>
                <input
                  id="jumlah"
                  type="number"
                  min={0}
                  required
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="kondisi" className={labelCls}>
                  Kondisi
                </label>
                <select
                  id="kondisi"
                  value={form.kondisi}
                  onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                  className={inputCls}
                >
                  <option>Baik</option>
                  <option>Rusak</option>
                  <option>Perawatan</option>
                </select>
              </div>
              <div>
                <label htmlFor="lokasi" className={labelCls}>
                  Lokasi
                </label>
                <input
                  id="lokasi"
                  placeholder="misal Lab A"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate("/barang")} className={tombolHantu}>
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
- [ ] `GET /api/status` menjawab 200 `{"success":true,"message":"InviLab API berjalan."}`
- [ ] `GET /api/barang` menjawab bentuk pagination `{items, pagination{page, limit, total, total_page}}`
- [ ] `POST /api/barang` tanpa kategori dijawab 422 `Kategori tidak ditemukan.`
- [ ] Halaman `Barang.jsx` dan `BarangForm.jsx` mengikuti kontrak `api()`, `useAuth()`, dan `ui.jsx` di `inisialisasi.md`
- [ ] Semua langkah sudah di-push langsung ke `main`
