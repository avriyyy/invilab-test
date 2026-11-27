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
