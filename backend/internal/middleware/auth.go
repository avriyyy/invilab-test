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
