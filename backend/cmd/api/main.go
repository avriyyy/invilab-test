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

	if err := db.AutoMigrate(&model.User{}, &model.Kategori{}, &model.Barang{}, &model.Peminjaman{}); err != nil {
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
