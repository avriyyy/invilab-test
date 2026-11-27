package seed

import (
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"

	"invilab/internal/model"
)

// Run mengisi data awal kalau tabel user masih kosong:
// dua akun demo (admin dan anggota), empat kategori, delapan barang,
// dan dua peminjaman contoh. Dijalankan sekali saat server pertama
// kali menyala dengan basis data kosong.
func Run(db *gorm.DB) {
	var jumlah int64
	db.Model(&model.User{}).Count(&jumlah)
	if jumlah > 0 {
		return
	}

	buatAkun := func(nama, email, password, role string) {
		hash, _ := bcrypt.GenerateFromPassword([]byte(password), bcrypt.DefaultCost)
		db.Create(&model.User{Nama: nama, Email: email, Password: string(hash), Role: role})
	}
	buatAkun("Admin InviLab", "admin@invilab.test", "admin123", "admin")
	buatAkun("Anggota InviLab", "anggota@invilab.test", "anggota123", "anggota")

	kategoris := []model.Kategori{
		{Nama: "Laptop", Deskripsi: "Laptop dan aksesorinya"},
		{Nama: "Perkakas", Deskripsi: "Obeng, tang, dan perkakas lain"},
		{Nama: "Elektronik", Deskripsi: "Alat ukur dan komponen elektronik"},
		{Nama: "Jaringan", Deskripsi: "Router, kabel, dan perangkat jaringan"},
	}
	for i := range kategoris {
		db.Create(&kategoris[i])
	}

	barang := []model.Barang{
		{KodeBarang: "BRG-001", Nama: "Laptop Lenovo ThinkPad", KategoriID: kategoris[0].ID, Jumlah: 5, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-002", Nama: "Kabel HDMI 2m", KategoriID: kategoris[3].ID, Jumlah: 12, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-003", Nama: "Arduino Uno R3", KategoriID: kategoris[2].ID, Jumlah: 8, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-004", Nama: "Multimeter Digital", KategoriID: kategoris[2].ID, Jumlah: 6, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-005", Nama: "Router TP-Link", KategoriID: kategoris[3].ID, Jumlah: 3, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-006", Nama: "Obeng Set 6 Pcs", KategoriID: kategoris[1].ID, Jumlah: 10, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-007", Nama: "Proyektor Epson", KategoriID: kategoris[2].ID, Jumlah: 2, Kondisi: "Perawatan", Lokasi: "Lab A"},
		{KodeBarang: "BRG-008", Nama: "Kabel LAN Cat6 5m", KategoriID: kategoris[3].ID, Jumlah: 15, Kondisi: "Baik", Lokasi: "Lab A"},
	}
	for i := range barang {
		db.Create(&barang[i])
	}

	kemarin := time.Now().AddDate(0, 0, -1)
	db.Create(&model.Peminjaman{
		BarangID: barang[0].ID, NamaPeminjam: "Budi Santoso", NIM: "H1H024050",
		TanggalPinjam: kemarin, Status: "Dipinjam",
	})
	db.Create(&model.Peminjaman{
		BarangID: barang[2].ID, NamaPeminjam: "Siti Rahma", NIM: "H1H024051",
		TanggalPinjam: kemarin, Status: "Dipinjam",
	})
}
