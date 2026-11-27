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
