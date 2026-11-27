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
