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
