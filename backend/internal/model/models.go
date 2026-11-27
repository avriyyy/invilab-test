package model

import (
	"time"

	"gorm.io/gorm"
)

// User adalah akun pengguna aplikasi. Role: admin atau anggota.
// Tabel user tidak dihitung sebagai CRUD.
type User struct {
	ID        uint           `gorm:"primaryKey" json:"id"`
	Nama      string         `gorm:"size:100;not null" json:"nama"`
	Email     string         `gorm:"size:100;uniqueIndex;not null" json:"email"`
	Password  string         `gorm:"size:255;not null" json:"-"`
	Role      string         `gorm:"size:20;not null;default:anggota" json:"role"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
	DeletedAt gorm.DeletedAt `gorm:"index" json:"-"`
}

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

// Request registrasi. Role tidak bisa dipilih dari publik, selalu anggota.
type RegisterRequest struct {
	Nama     string `json:"nama" validate:"required,min=3,max=100"`
	Email    string `json:"email" validate:"required,email,max=100"`
	Password string `json:"password" validate:"required,min=6,max=100"`
}

type LoginRequest struct {
	Email    string `json:"email" validate:"required,email"`
	Password string `json:"password" validate:"required"`
}

type KategoriRequest struct {
	Nama      string `json:"nama" validate:"required,min=2,max=100"`
	Deskripsi string `json:"deskripsi" validate:"max=255"`
}

type BarangRequest struct {
	KodeBarang string `json:"kode_barang" validate:"required,min=2,max=50"`
	Nama       string `json:"nama" validate:"required,min=2,max=150"`
	KategoriID uint   `json:"kategori_id" validate:"required"`
	Jumlah     int    `json:"jumlah" validate:"min=0"`
	Kondisi    string `json:"kondisi" validate:"required,oneof=Baik Rusak Perawatan"`
	Lokasi     string `json:"lokasi" validate:"max=100"`
}

type PeminjamanRequest struct {
	BarangID       uint   `json:"barang_id" validate:"required"`
	NamaPeminjam   string `json:"nama_peminjam" validate:"required,min=3,max=100"`
	NIM            string `json:"nim" validate:"required,min=5,max=20"`
	TanggalPinjam  string `json:"tanggal_pinjam" validate:"required"`
	TanggalKembali string `json:"tanggal_kembali"`
	Status         string `json:"status" validate:"omitempty,oneof=Dipinjam Dikembalikan"`
}
