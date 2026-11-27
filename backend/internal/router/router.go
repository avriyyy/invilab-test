package router

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/handler"
	"invilab/internal/middleware"
)

// Setup mendaftarkan semua route API.
// Urutan middleware penting: pengecekan role ditulis SEBELUM handler,
// karena Fiber v3 menjalankan handler sesuai urutan penulisan.
func Setup(app *fiber.App, db *gorm.DB, jwtSecret string) {
	auth := handler.NewAuthHandler(db, jwtSecret)
	kategori := handler.NewKategoriHandler(db)
	barang := handler.NewBarangHandler(db)
	pinjam := handler.NewPeminjamanHandler(db)

	api := app.Group("/api")

	// Cek status, dipakai untuk memastikan API hidup saat deployment.
	api.Get("/status", func(c fiber.Ctx) error {
		return c.Status(fiber.StatusOK).JSON(fiber.Map{
			"success": true,
			"message": "InviLab API berjalan.",
		})
	})

	// Autentikasi: registrasi dan login terbuka, sisanya butuh token.
	authGroup := api.Group("/auth")
	authGroup.Post("/register", auth.Register)
	authGroup.Post("/login", auth.Login)
	authGroup.Get("/profile", middleware.Autentikasi(jwtSecret), auth.Profile)
	authGroup.Post("/logout", middleware.Autentikasi(jwtSecret), auth.Logout)

	// Semua endpoint resource butuh login.
	lindungi := middleware.Autentikasi(jwtSecret)
	admin := middleware.HanyaPeran("admin")

	// Kategori: baca boleh semua role, tulis hanya admin.
	k := api.Group("/kategori", lindungi)
	k.Get("/", kategori.List)
	k.Get("/:id", kategori.Detail)
	k.Post("/", admin, kategori.Create)
	k.Put("/:id", admin, kategori.Update)
	k.Delete("/:id", admin, kategori.Delete)

	// Barang: baca boleh semua role, tulis hanya admin.
	b := api.Group("/barang", lindungi)
	b.Get("/", barang.List)
	b.Get("/:id", barang.Detail)
	b.Post("/", admin, barang.Create)
	b.Put("/:id", admin, barang.Update)
	b.Delete("/:id", admin, barang.Delete)

	// Peminjaman: baca dan buat boleh semua role yang login,
	// ubah dan hapus hanya admin.
	p := api.Group("/peminjaman", lindungi)
	p.Get("/", pinjam.List)
	p.Get("/:id", pinjam.Detail)
	p.Post("/", pinjam.Create)
	p.Put("/:id", admin, pinjam.Update)
	p.Delete("/:id", admin, pinjam.Delete)
}
