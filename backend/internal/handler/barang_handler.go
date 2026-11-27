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
