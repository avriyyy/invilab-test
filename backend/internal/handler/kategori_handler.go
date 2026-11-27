package handler

import (
	"github.com/gofiber/fiber/v3"
	"gorm.io/gorm"

	"invilab/internal/model"
)

// KategoriHandler menangani CRUD kategori.
type KategoriHandler struct {
	DB *gorm.DB
}

func NewKategoriHandler(db *gorm.DB) *KategoriHandler {
	return &KategoriHandler{DB: db}
}

// List mengembalikan daftar kategori.
func (h *KategoriHandler) List(c fiber.Ctx) error {
	var daftar []model.Kategori
	if err := h.DB.Order("nama ASC").Find(&daftar).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal mengambil data kategori.")
	}
	return Sukses(c, fiber.StatusOK, "Daftar kategori ditemukan.", daftar)
}

// Detail mengembalikan satu kategori beserta barang-barangnya.
func (h *KategoriHandler) Detail(c fiber.Ctx) error {
	id := c.Params("id")
	var kategori model.Kategori
	if err := h.DB.Preload("Barang").First(&kategori, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Kategori tidak ditemukan.")
	}
	return Sukses(c, fiber.StatusOK, "Kategori ditemukan.", kategori)
}

// Create menambah kategori baru. Hanya admin.
func (h *KategoriHandler) Create(c fiber.Ctx) error {
	var req model.KategoriRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	kategori := model.Kategori{Nama: req.Nama, Deskripsi: req.Deskripsi}
	if err := h.DB.Create(&kategori).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Nama kategori sudah dipakai.")
	}
	return Sukses(c, fiber.StatusCreated, "Kategori berhasil ditambah.", kategori)
}

// Update mengubah kategori. Hanya admin.
func (h *KategoriHandler) Update(c fiber.Ctx) error {
	id := c.Params("id")
	var kategori model.Kategori
	if err := h.DB.First(&kategori, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Kategori tidak ditemukan.")
	}

	var req model.KategoriRequest
	if err := c.Bind().JSON(&req); err != nil {
		return Gagal(c, fiber.StatusBadRequest, "Format data tidak valid.")
	}
	if !Validasi(c, &req) {
		return nil
	}

	kategori.Nama = req.Nama
	kategori.Deskripsi = req.Deskripsi
	if err := h.DB.Save(&kategori).Error; err != nil {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Nama kategori sudah dipakai.")
	}
	return Sukses(c, fiber.StatusOK, "Kategori berhasil diubah.", kategori)
}

// Delete menghapus kategori. Hanya admin. Kategori yang masih
// dipakai barang tidak bisa dihapus.
func (h *KategoriHandler) Delete(c fiber.Ctx) error {
	id := c.Params("id")
	var kategori model.Kategori
	if err := h.DB.First(&kategori, id).Error; err != nil {
		return Gagal(c, fiber.StatusNotFound, "Kategori tidak ditemukan.")
	}

	var jumlah int64
	h.DB.Model(&model.Barang{}).Where("kategori_id = ?", id).Count(&jumlah)
	if jumlah > 0 {
		return Gagal(c, fiber.StatusUnprocessableEntity, "Kategori masih dipakai barang, tidak bisa dihapus.")
	}

	if err := h.DB.Delete(&kategori).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal menghapus kategori.")
	}
	return Sukses(c, fiber.StatusOK, "Kategori berhasil dihapus.", nil)
}
