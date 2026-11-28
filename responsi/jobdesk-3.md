# jobdesk-3 - CRUD Kategori, Frontend & Integrasi

**CRUD milikmu (backend + halaman): Kategori**

**Cara kerja:** langsung di branch `main`, tidak buat branch baru (mulai setelah `jobdesk-1` di-push ke main; `git pull` dulu sebelum mulai, commit + push langsung ke `main` setelah tiap langkah lolos cek).

Kamu membangun CRUD Kategori, komponen UI bersama, layout, routing, skeleton frontend, dan verifikasi akhir. Kerja langsung di `main` terbaru yang sudah berisi `jobdesk-1`, paralel dengan `jobdesk-2`. Baca `inisialisasi.md` dulu, terutama kontrak di bagian 3.

## Langkah 1 - Skeleton frontend Vite + React

Buat proyek Vite dengan template React, lalu pasang dependency yang dipakai repo. File `package.json` di bawah adalah versi final; jalankan `npm install` untuk membuat `package-lock.json` (file lock dibuat otomatis, jangan ditulis manual). **Commit:** `chore: skeleton frontend Vite + React` → push duluan supaya jobdesk-1 dan jobdesk-2 bisa `npm install` dan menjalankan frontend lokal.

**Path:** `frontend/package.json`

```json
{
  "name": "invilab-vite",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "oxlint",
    "preview": "vite preview"
  },
  "dependencies": {
    "@tailwindcss/vite": "^4.3.5",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "react-router-dom": "^7.18.7",
    "tailwindcss": "^4.3.5"
  },
  "devDependencies": {
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.3.0",
    "oxlint": "^1.94.0",
    "vite": "^8.4.0"
  }
}
```

```bash
cd frontend
npm install
npm install react-router-dom tailwindcss @tailwindcss/vite
npm install -D @types/react @types/react-dom @vitejs/plugin-react oxlint vite
```

**Path:** `frontend/vite.config.js`

```js
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    // Port 8080 supaya origin cocok dengan FRONTEND_URL di .env backend
    // (CORS backend hanya mengizinkan origin itu). strictPort: true supaya
    // kalau port sudah dipakai, server gagal keras dan tidak diam-diam
    // pindah port (yang akan merusak CORS).
    port: 8080,
    strictPort: true,
  },
})
```

**Path:** `frontend/index.html`

```html
<!doctype html>
<html lang="id">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>InviLab - Inventaris Laboratorium</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

**Path:** `frontend/src/index.css`

```css
@import "tailwindcss";
```

**Path:** `frontend/src/main.jsx`

```jsx
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import App from "./App.jsx";
import "./index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
  </StrictMode>
);
```

**Path:** `frontend/.env.example`

```
# URL dasar API backend. Saat deploy, ganti dengan URL API produksi.
VITE_API_URL=http://localhost:3000
```

Buat `.env` sendiri dari contoh (jangan di-commit):

```bash
cp frontend/.env.example frontend/.env
# isi VITE_API_URL kalau API tidak di http://localhost:3000
```

**Path:** `frontend/.gitignore`

```
# Logs
logs
*.log
npm-debug.log*
yarn-debug.log*
yarn-error.log*
pnpm-debug.log*
lerna-debug.log*

node_modules
dist
dist-ssr
*.local

# Editor directories and files
.vscode/*
!.vscode/extensions.json
.idea
.DS_Store
*.suo
*.ntvs*
*.njsproj
*.sln
*.sw?
```

File ini dibuat otomatis oleh template Vite, jangan diubah.

**Path:** `frontend/.oxlintrc.json`

```json
{
  "$schema": "./node_modules/oxlint/configuration_schema.json",
  "plugins": ["react", "oxc"],
  "rules": {
    "react/rules-of-hooks": "error",
    "react/only-export-components": ["warn", { "allowConstantExport": true }]
  }
}
```

**Path:** `frontend/.dockerignore`

```
node_modules
dist
.env
*.log
```

Catatan: `npm run dev` baru bisa jalan setelah Langkah 7 (`App.jsx`) selesai, karena `main.jsx` mengimpor `App.jsx`. Sampai saat itu, cek file per file dengan `npx oxlint <file>`.

## Langkah 2 - Model Kategori (sisipan di models.go)

File `models.go` milik jobdesk-1. Kamu hanya menambahkan snippet berikut di titik yang ditandai, jangan menulis ulang file-nya. **Commit:** `feat: model Kategori` → push boleh.

Sisipkan struct Kategori tepat sebelum komentar `// Barang adalah barang inventaris laboratorium.`, setelah struct `User` (yang ditulis jobdesk-2):

**Path:** `backend/internal/model/models.go`

```go
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
```

Sisipkan request kategori tepat sebelum `type BarangRequest struct {`, setelah `LoginRequest`:

**Path:** `backend/internal/model/models.go`

```go
type KategoriRequest struct {
	Nama      string `json:"nama" validate:"required,min=2,max=100"`
	Deskripsi string `json:"deskripsi" validate:"max=255"`
}
```

## Langkah 3 - CRUD Kategori

Daftar dengan pagination, detail dengan Preload barang, tambah, ubah, hapus. Kategori yang masih dipakai barang tidak bisa dihapus. **Commit:** `feat: CRUD Kategori + pagination` → push boleh.

**Path:** `backend/internal/handler/kategori_handler.go`

```go
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

// List mengembalikan daftar kategori dengan pagination.
func (h *KategoriHandler) List(c fiber.Ctx) error {
	page, limit, offset := Pagination(c)

	var total int64
	h.DB.Model(&model.Kategori{}).Count(&total)

	var daftar []model.Kategori
	if err := h.DB.Order("nama ASC").Limit(limit).Offset(offset).Find(&daftar).Error; err != nil {
		return Gagal(c, fiber.StatusInternalServerError, "Gagal mengambil data kategori.")
	}
	return Sukses(c, fiber.StatusOK, "Daftar kategori ditemukan.", fiber.Map{
		"items":      daftar,
		"pagination": MetaPagination(page, limit, total),
	})
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
```

## Langkah 4 - Router + seed kategori

Tambahkan potongan berikut. **Commit:** `feat: route + seed kategori` → push boleh.

Tambahkan baris constructor kategori tepat sebelum baris `barang := handler.NewBarangHandler(db)` di `func Setup`:

**Path:** `backend/internal/router/router.go`

```go
	kategori := handler.NewKategoriHandler(db)
```

Sisipkan grup route kategori tepat sebelum komentar `// Barang: baca boleh semua role, tulis hanya admin.`:

**Path:** `backend/internal/router/router.go`

```go
	// Kategori: baca boleh semua role, tulis hanya admin.
	k := api.Group("/kategori", lindungi)
	k.Get("/", kategori.List)
	k.Get("/:id", kategori.Detail)
	k.Post("/", admin, kategori.Create)
	k.Put("/:id", admin, kategori.Update)
	k.Delete("/:id", admin, kategori.Delete)
```

Ubah baris `AutoMigrate` di `main.go`:

**Path:** `backend/cmd/api/main.go`

```go
db.AutoMigrate(&model.User{}, &model.Barang{}, &model.Peminjaman{})
```

menjadi:

**Path:** `backend/cmd/api/main.go`

```go
db.AutoMigrate(&model.User{}, &model.Kategori{}, &model.Barang{}, &model.Peminjaman{})
```

Kalau jobdesk-2 belum push ke main saat kamu mengerjakan langkah ini, baris awalnya masih `db.AutoMigrate(&model.Barang{})` (versi jobdesk-1). Ubah langsung ke baris final di atas; kalau push kamu ditolak karena main sudah maju, `git pull` dulu dan selesaikan konflik di baris ini dengan memakai baris final ini, lalu push lagi.

Ganti blok gate seed barang (versi jobdesk-1) berikut:

**Path:** `backend/internal/seed/seed.go`

```go
	// Data contoh barang hanya diisi sekali, kalau tabel barang masih kosong.
	var jumlahBarang int64
	db.Model(&model.Barang{}).Count(&jumlahBarang)
	if jumlahBarang > 0 {
		return
	}
```

menjadi (perhatikan baris kosong di awal blok baru, pemisah dari blok akun demo di atasnya):

**Path:** `backend/internal/seed/seed.go`

```go

	// Data contoh (kategori, barang, peminjaman) hanya diisi sekali,
	// kalau tabel kategori masih kosong.
	var jumlahKategori int64
	db.Model(&model.Kategori{}).Count(&jumlahKategori)
	if jumlahKategori > 0 {
		return
	}

	kategoris := []model.Kategori{
		{Nama: "Laptop", Deskripsi: "Laptop dan aksesorinya"},
		{Nama: "Perkakas", Deskripsi: "Obeng, tang, dan perkakas lain"},
		{Nama: "Elektronik", Deskripsi: "Alat ukur dan komponen elektronik"},
		{Nama: "Jaringan", Deskripsi: "Router, kabel, dan perangkat jaringan"},
	}
	for i := range kategoris {
		db.Create(&kategoris[i])
	}
```

Terakhir, ganti isi seed barang berikut (KategoriID angka menjadi referensi ke kategori yang baru dibuat):

**Path:** `backend/internal/seed/seed.go`

```go
	barang := []model.Barang{
		{KodeBarang: "BRG-001", Nama: "Laptop Lenovo ThinkPad", KategoriID: 1, Jumlah: 5, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-002", Nama: "Kabel HDMI 2m", KategoriID: 4, Jumlah: 12, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-003", Nama: "Arduino Uno R3", KategoriID: 3, Jumlah: 8, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-004", Nama: "Multimeter Digital", KategoriID: 3, Jumlah: 6, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-005", Nama: "Router TP-Link", KategoriID: 4, Jumlah: 3, Kondisi: "Baik", Lokasi: "Lab A"},
		{KodeBarang: "BRG-006", Nama: "Obeng Set 6 Pcs", KategoriID: 2, Jumlah: 10, Kondisi: "Baik", Lokasi: "Lab B"},
		{KodeBarang: "BRG-007", Nama: "Proyektor Epson", KategoriID: 3, Jumlah: 2, Kondisi: "Perawatan", Lokasi: "Lab A"},
		{KodeBarang: "BRG-008", Nama: "Kabel LAN Cat6 5m", KategoriID: 4, Jumlah: 15, Kondisi: "Baik", Lokasi: "Lab A"},
	}
	for i := range barang {
		db.Create(&barang[i])
	}
```

menjadi:

**Path:** `backend/internal/seed/seed.go`

```go
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
```

## Langkah 5 - Komponen UI bersama

Komponen dipakai semua halaman, jadi jangan ubah props-nya (kontrak di `inisialisasi.md` bagian 3.6). **Commit:** `feat: komponen UI (Pagination, Pesan, Konfirmasi)` → push boleh.

**Path:** `frontend/src/components/ui.jsx`

```jsx
// Komponen kecil yang dipakai ulang di halaman-halaman.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Pesan({ teks, gagal }) {
  if (!teks) return null;
  return (
    <div
      className={`mb-4 rounded-md px-4 py-3 text-sm ${
        gagal ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
      }`}
    >
      {teks}
    </div>
  );
}

export function Badge({ children, warna }) {
  const peta = {
    hijau: "bg-green-100 text-green-800",
    kuning: "bg-yellow-100 text-yellow-800",
    merah: "bg-red-100 text-red-800",
    biru: "bg-blue-100 text-blue-800",
    abu: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        peta[warna] || peta.abu
      }`}
    >
      {children}
    </span>
  );
}

export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export const labelCls = "mb-1 block text-sm font-medium";

export const tombolPrimer =
  "cursor-pointer rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60";

export const tombolHapus =
  "cursor-pointer rounded-md bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-800";

export const tombolHapusBesar =
  "cursor-pointer rounded-md bg-red-700 px-4 py-2 text-sm font-medium text-white hover:bg-red-800 disabled:opacity-60";

export const tombolKecil =
  "cursor-pointer rounded-md bg-blue-700 px-3 py-1 text-xs font-medium text-white hover:bg-blue-800";

export const tombolHantu =
  "cursor-pointer rounded-md bg-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-300";

// Ambil pesan sukses dari halaman form (location state), lalu bersihkan
// state-nya supaya pesan tidak muncul lagi saat halaman di-refresh.
export function usePesanState() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pesan, setPesan] = useState(location.state?.pesan || "");
  const [gagal, setGagal] = useState(false);
  useEffect(() => {
    if (location.state?.pesan) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Hanya sekali saat halaman dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { pesan, setPesan, gagal, setGagal };
}

function daftarNomorHalaman(halaman, totalHalaman) {
  if (totalHalaman <= 7) {
    return Array.from({ length: totalHalaman }, (_, i) => i + 1);
  }
  const awal = Math.max(2, halaman - 1);
  const akhir = Math.min(totalHalaman - 1, halaman + 1);
  const daftar = [1];
  if (awal > 2) daftar.push("…");
  for (let i = awal; i <= akhir; i++) daftar.push(i);
  if (akhir < totalHalaman - 1) daftar.push("…");
  daftar.push(totalHalaman);
  return daftar;
}

// Pagination standar: info jumlah data di kiri, kontrol halaman di kanan.
export function Pagination({ halaman, totalHalaman, total, batas = 10, satuan, onPindah }) {
  const awal = total === 0 ? 0 : (halaman - 1) * batas + 1;
  const akhir = Math.min(halaman * batas, total);
  const tombolPindah =
    "cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
  const tombolNomor =
    "min-w-9 cursor-pointer rounded-md border px-2 py-1.5 text-sm";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        Menampilkan {awal}-{akhir} dari {total} {satuan}
      </p>
      <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
        <button
          onClick={() => onPindah(halaman - 1)}
          disabled={halaman <= 1}
          className={tombolPindah}
        >
          Sebelumnya
        </button>
        {daftarNomorHalaman(halaman, totalHalaman).map((nomor, i) =>
          nomor === "…" ? (
            <span key={`lompati-${i}`} className="px-1 text-sm text-slate-500">
              …
            </span>
          ) : (
            <button
              key={nomor}
              onClick={() => onPindah(nomor)}
              aria-current={nomor === halaman ? "page" : undefined}
              className={`${tombolNomor} ${
                nomor === halaman
                  ? "border-blue-700 bg-blue-700 font-medium text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {nomor}
            </button>
          )
        )}
        <button
          onClick={() => onPindah(halaman + 1)}
          disabled={halaman >= totalHalaman}
          className={tombolPindah}
        >
          Berikutnya
        </button>
      </nav>
    </div>
  );
}

export function Konfirmasi({ terbuka, judul, pesan, onBatal, onYa, sedangProses }) {
  useEffect(() => {
    if (!terbuka) return;
    function kunci(e) {
      if (e.key === "Escape") onBatal();
    }
    window.addEventListener("keydown", kunci);
    return () => window.removeEventListener("keydown", kunci);
  }, [terbuka, onBatal]);

  if (!terbuka) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4"
      onClick={onBatal}
    >
      <div
        role="dialog"
        aria-modal="true"
        className="w-full max-w-sm rounded-lg border border-slate-200 bg-white p-5 shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-lg font-semibold">{judul}</h3>
        <p className="mt-2 text-sm text-slate-600">{pesan}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button onClick={onBatal} disabled={sedangProses} className={tombolHantu}>
            Batal
          </button>
          <button onClick={onYa} disabled={sedangProses} className={tombolHapusBesar}>
            Hapus
          </button>
        </div>
      </div>
    </div>
  );
}
```

## Langkah 6 - Layout + navbar

Navbar sticky: brand di kiri, navigasi di kanan, satu ikon akun yang diklik membuka popup berisi nama, email, role, dan tombol Keluar. **Commit:** `feat: navbar + menu akun` → push boleh.

**Path:** `frontend/src/components/Layout.jsx`

```jsx
import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function IkonPengguna() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IkonKeluar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuTerbuka) return;
    function tutup(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuTerbuka(false);
      }
    }
    function kunci(e) {
      if (e.key === "Escape") setMenuTerbuka(false);
    }
    document.addEventListener("mousedown", tutup);
    window.addEventListener("keydown", kunci);
    return () => {
      document.removeEventListener("mousedown", tutup);
      window.removeEventListener("keydown", kunci);
    };
  }, [menuTerbuka]);

  const dasar = "rounded-md px-3 py-2 text-sm text-blue-100 hover:bg-blue-900 hover:text-white";
  const tautan = ({ isActive }) => dasar + (isActive ? " bg-blue-900 text-white" : "");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-10 bg-[#0b3d5c] text-white shadow-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <NavLink to="/barang" className="mr-2 text-xl font-bold">
            InviLab
          </NavLink>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            <NavLink to="/barang" className={tautan}>
              Barang
            </NavLink>
            <NavLink to="/peminjaman" className={tautan}>
              Peminjaman
            </NavLink>
            <NavLink to="/kategori" className={tautan}>
              Kategori
            </NavLink>
          </nav>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuTerbuka((buka) => !buka)}
              title="Akun"
              aria-label="Menu akun"
              aria-expanded={menuTerbuka}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-blue-100 hover:bg-blue-900 hover:text-white"
            >
              <IkonPengguna />
            </button>
            {menuTerbuka && user && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-4 text-slate-800 shadow-lg">
                <p className="font-semibold">{user.nama}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Anggota"}
                </span>
                <button
                  onClick={() => {
                    setMenuTerbuka(false);
                    logout();
                  }}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  <IkonKeluar />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
```

## Langkah 7 - Routing + penjaga login/admin

`PerluLogin` menjaga semua halaman di dalam `Layout` (belum login dilempar ke `/login`). `PerluAdmin` menjaga route form admin (bukan admin dilempar ke `/barang`). **Commit:** `feat: routing + penjaga login/admin` → push boleh.

**Path:** `frontend/src/App.jsx`

```jsx
import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Barang from "./pages/Barang";
import BarangForm from "./pages/BarangForm";
import Peminjaman from "./pages/Peminjaman";
import PeminjamanForm from "./pages/PeminjamanForm";
import Kategori from "./pages/Kategori";
import KategoriForm from "./pages/KategoriForm";
import Profile from "./pages/Profile";

// Route yang dibungkus ini hanya bisa dibuka kalau sudah login.
function PerluLogin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Route yang dibungkus ini hanya bisa dibuka oleh admin.
function PerluAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/barang" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <PerluLogin>
            <Layout />
          </PerluLogin>
        }
      >
        <Route path="/barang" element={<Barang />} />
        <Route
          path="/barang/tambah"
          element={
            <PerluAdmin>
              <BarangForm />
            </PerluAdmin>
          }
        />
        <Route
          path="/barang/:id/ubah"
          element={
            <PerluAdmin>
              <BarangForm />
            </PerluAdmin>
          }
        />
        <Route path="/peminjaman" element={<Peminjaman />} />
        <Route path="/peminjaman/tambah" element={<PeminjamanForm />} />
        <Route
          path="/peminjaman/:id/ubah"
          element={
            <PerluAdmin>
              <PeminjamanForm />
            </PerluAdmin>
          }
        />
        <Route path="/kategori" element={<Kategori />} />
        <Route
          path="/kategori/tambah"
          element={
            <PerluAdmin>
              <KategoriForm />
            </PerluAdmin>
          }
        />
        <Route
          path="/kategori/:id/ubah"
          element={
            <PerluAdmin>
              <KategoriForm />
            </PerluAdmin>
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/" element={<Navigate to={user ? "/barang" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/barang" : "/login"} replace />} />
    </Routes>
  );
}
```

## Langkah 8 - Halaman Daftar Kategori

**Commit:** `feat: halaman Daftar Kategori` → push boleh.

**Path:** `frontend/src/pages/Kategori.jsx`

```jsx
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Konfirmasi,
  Pagination,
  Pesan,
  tombolHapus,
  tombolKecil,
  tombolPrimer,
  usePesanState,
} from "../components/ui";

const BATAS = 10;

export default function Kategori() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const { pesan, setPesan, gagal, setGagal } = usePesanState();
  const [daftar, setDaftar] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [memuat, setMemuat] = useState(true);
  const [hapusTarget, setHapusTarget] = useState(null);

  async function muat(hal = 1) {
    setMemuat(true);
    try {
      const data = await api(`/api/kategori?page=${hal}&limit=${BATAS}`);
      setDaftar(data.data.items || []);
      setHalaman(data.data.pagination.page);
      setTotalHalaman(data.data.pagination.total_page);
      setTotal(data.data.pagination.total);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muat(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function hapus(id) {
    try {
      await api(`/api/kategori/${id}`, { method: "DELETE" });
      setPesan("Kategori berhasil dihapus.");
      setGagal(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Daftar Kategori</h2>
        {sayaAdmin && (
          <Link to="/kategori/tambah" className={tombolPrimer}>
            Tambah Kategori
          </Link>
        )}
      </div>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Deskripsi</th>
                {sayaAdmin && <th className="px-3 py-2 text-right">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {memuat ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                    Memuat...
                  </td>
                </tr>
              ) : daftar.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-3 py-6 text-center text-slate-500">
                    Belum ada kategori.
                  </td>
                </tr>
              ) : (
                daftar.map((k) => (
                  <tr key={k.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{k.nama}</td>
                    <td className="px-3 py-2">{k.deskripsi || "-"}</td>
                    {sayaAdmin && (
                      <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                        <Link to={`/kategori/${k.id}/ubah`} className={tombolKecil}>
                          Ubah
                        </Link>
                        <button onClick={() => setHapusTarget(k)} className={tombolHapus}>
                          Hapus
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <Pagination
          halaman={halaman}
          totalHalaman={totalHalaman}
          total={total}
          batas={BATAS}
          satuan="kategori"
          onPindah={muat}
        />
      </div>

      <Konfirmasi
        terbuka={Boolean(hapusTarget)}
        judul="Hapus Kategori"
        pesan={
          hapusTarget
            ? `Hapus kategori ${hapusTarget.nama}? Tindakan ini tidak bisa dibatalkan.`
            : ""
        }
        onBatal={() => setHapusTarget(null)}
        onYa={() => {
          const id = hapusTarget.id;
          setHapusTarget(null);
          hapus(id);
        }}
      />
    </div>
  );
}
```

## Langkah 9 - Halaman form Kategori

Form tambah dan ubah kategori di satu file (mode tambah kalau tidak ada `:id` di URL, mode ubah kalau ada). **Commit:** `feat: halaman form Kategori` → push boleh.

**Path:** `frontend/src/pages/KategoriForm.jsx`

```jsx
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pesan, inputCls, labelCls, tombolHantu, tombolPrimer } from "../components/ui";

export default function KategoriForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: "", deskripsi: "" });
  const [memuat, setMemuat] = useState(edit);
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!edit) return;
    api(`/api/kategori/${id}`)
      .then((data) => {
        setForm({ nama: data.data.nama, deskripsi: data.data.deskripsi || "" });
      })
      .catch((err) => setPesan(err.message))
      .finally(() => setMemuat(false));
  }, [edit, id]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setMenyimpan(true);
    const isi = { nama: form.nama.trim(), deskripsi: form.deskripsi.trim() };
    try {
      if (edit) {
        await api(`/api/kategori/${id}`, { method: "PUT", body: JSON.stringify(isi) });
      } else {
        await api("/api/kategori", { method: "POST", body: JSON.stringify(isi) });
      }
      navigate("/kategori", { state: { pesan: "Kategori berhasil disimpan." } });
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{edit ? "Ubah Kategori" : "Tambah Kategori"}</h2>
        <Link to="/kategori" className={tombolHantu}>
          Kembali ke daftar
        </Link>
      </div>
      <Pesan teks={pesan} gagal />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {memuat ? (
          <p className="py-6 text-center text-slate-500">Memuat...</p>
        ) : (
          <form onSubmit={simpan} className="space-y-4">
            <div>
              <label htmlFor="nama" className={labelCls}>
                Nama
              </label>
              <input
                id="nama"
                required
                value={form.nama}
                onChange={(e) => setForm({ ...form, nama: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="deskripsi" className={labelCls}>
                Deskripsi
              </label>
              <input
                id="deskripsi"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className={inputCls}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate("/kategori")} className={tombolHantu}>
                Batal
              </button>
              <button type="submit" disabled={menyimpan} className={tombolPrimer}>
                {menyimpan ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
```

## Langkah 10 - Dockerfile + nginx frontend

**Path:** `frontend/Dockerfile`

```dockerfile
# syntax=docker/dockerfile:1
# Build context: folder frontend/ (atur base directory ke /frontend).
# VITE_API_URL wajib diisi sebagai build arg (Vite menanam env saat build).
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . ./
ARG VITE_API_URL
ENV VITE_API_URL=$VITE_API_URL
RUN npm run build

FROM nginx:alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

Catatan: baris komentar tentang base directory di atas sudah dipersingkat di panduan ini (nama platform deployment tidak disebutkan). Isi kode lainnya sama persis dengan file di repo. `VITE_API_URL` wajib diisi sebagai build arg, karena Vite menanam env saat build.

**Path:** `frontend/nginx.conf`

```nginx
server {
    listen 80;
    server_name _;
    root /usr/share/nginx/html;
    index index.html;

    # SPA fallback: refresh di route selain / tetap membuka index.html,
    # supaya React Router yang menangani rutenya (bukan 404 dari nginx).
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

SPA fallback (`try_files ... /index.html`) membuat refresh di route selain `/` tetap membuka aplikasi, bukan 404 dari nginx. **Commit:** `chore: Dockerfile + nginx frontend` → push boleh.

## Langkah 11 - Update README + cek deployment

Isi tabel anggota di `README.md` dengan nama sesuai jobdesk yang dipegang masing-masing. Ganti baris `(diisi kelompok)` berikut:

```markdown
| (diisi kelompok) | Jobdesk 1: fondasi backend + CRUD Barang, termasuk pagination + pencarian di GET /api/barang |
| (diisi kelompok) | Jobdesk 2: autentikasi (admin + anggota) + CRUD Peminjaman, termasuk relasi Preload Barang |
| (diisi kelompok) | Jobdesk 3: CRUD Kategori + frontend dan integrasi (halaman ketiga resource, integrasi FE-BE) |
```

menjadi (kelompok: Apriyudha H1H024010, Difa' Tamaya Maulidina Adz Dzikro H1H024019, Afif Nur Rahman H1H024016; tiap anggota mengisi baris jobdesk yang dipegangnya):

```markdown
| Apriyudha | Jobdesk 1: fondasi backend + CRUD Barang, termasuk pagination + pencarian di GET /api/barang |
| Difa' Tamaya Maulidina Adz Dzikro | Jobdesk 2: autentikasi (admin + anggota) + CRUD Peminjaman, termasuk relasi Preload Barang |
| Afif Nur Rahman | Jobdesk 3: CRUD Kategori + frontend dan integrasi (halaman ketiga resource, integrasi FE-BE) |
```

Pembagian di atas sudah sesuai hasil acak kelompok (Difa' J1, Afif J2, Apriyudha J3). Setelah video presentasi diunggah ke YouTube, ganti `(menyusul)` di bagian Video Presentasi dengan tautan videonya. **Commit:** `docs: isi jobdesk + tautan video di README` → push boleh.

Cek deployment (setelah semua jobdesk push ke `main` dan aplikasi sudah di-deploy):

```bash
curl -s https://api-invilab.apriyudha.my.id/api/status
# {"success":true,"message":"InviLab API berjalan."}

curl -s -o /dev/null -w "%{http_code}\n" https://invilab.apriyudha.my.id/
# 200
curl -s -o /dev/null -w "%{http_code}\n" https://invilab.apriyudha.my.id/barang
# 200 (refresh di route selain beranda tidak 404)
```

URL frontend dan backend harus tetap aktif sampai penilaian selesai.

## Langkah 12 - Verifikasi akhir (semua jobdesk sudah push ke main)

Jalankan dari basis data kosong (hapus database `invilab` lalu buat lagi, atau pakai database baru) supaya seed berjalan penuh:

```bash
cd backend
go build ./...
go vet ./...
go run ./cmd/api   # API jalan di http://localhost:3000

cd ../frontend
npm run build      # hasil build di frontend/dist/
npm run dev        # dev server di http://localhost:8080
```

Cek dengan curl (ganti `TOKEN_ADMIN` dan `TOKEN_ANGGOTA` dengan token dari login):

```bash
# Status + akun demo ter-seed (8 barang, 4 kategori, 2 peminjaman)
curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@invilab.test","password":"admin123"}'
curl -s "http://localhost:3000/api/barang?page=1&limit=10" -H "Authorization: Bearer TOKEN_ADMIN"
# total 8 barang
curl -s "http://localhost:3000/api/kategori?page=1&limit=10" -H "Authorization: Bearer TOKEN_ADMIN"
# total 4 kategori
curl -s "http://localhost:3000/api/peminjaman?page=1&limit=10" -H "Authorization: Bearer TOKEN_ADMIN"
# total 2 peminjaman, tiap item membawa objek barang (Preload)

# Pencarian barang
curl -s "http://localhost:3000/api/barang?search=laptop" -H "Authorization: Bearer TOKEN_ADMIN"
# total 1 (Laptop Lenovo ThinkPad)

# Filter peminjaman
curl -s "http://localhost:3000/api/peminjaman?status=Dipinjam" -H "Authorization: Bearer TOKEN_ADMIN"
# total 2

# Anggota tidak boleh tulis barang (403), tapi boleh meminjam (201)
curl -s -X POST http://localhost:3000/api/barang \
  -H "Authorization: Bearer TOKEN_ANGGOTA" -H "Content-Type: application/json" \
  -d '{"kode_barang":"BRG-009","nama":"Uji","kategori_id":1,"jumlah":1,"kondisi":"Baik","lokasi":"Lab A"}'
# {"success":false,"message":"Akses ditolak, role kamu tidak punya hak untuk ini."}

# Validasi dijawab 422 dengan pesan bahasa Indonesia
curl -s -X POST http://localhost:3000/api/kategori \
  -H "Authorization: Bearer TOKEN_ADMIN" -H "Content-Type: application/json" \
  -d '{"nama":"","deskripsi":""}'
# {"success":false,"message":"Nama wajib diisi."}
```

Cek di browser (http://localhost:8080): login sebagai anggota, pastikan tombol Tambah/Ubah/Hapus tidak terlihat dan route `/barang/tambah` melempar ke `/barang`. Login sebagai admin, pastikan semua tombol tulis ada. Cek popup hapus muncul saat tombol Hapus diklik, dan pagination tampil di ketiga tabel.

## Checklist serah terima

- [ ] `go build ./...` dan `go vet ./...` hijau di folder `backend/`
- [ ] `npm run build` hijau di folder `frontend/`
- [ ] Seed dari basis data kosong menghasilkan 8 barang, 4 kategori, 2 peminjaman, dan 2 akun demo
- [ ] Register, login, profil, logout, dan 403 anggota lolos curl
- [ ] Ketiga CRUD bisa dijalankan dari frontend (daftar, tambah, ubah, hapus)
- [ ] Pagination tampil di ketiga tabel; pencarian barang dan filter peminjaman bekerja
- [ ] Refresh di route selain beranda tidak 404
- [ ] README sudah berisi nama + jobdesk tiap anggota dan tautan video
- [ ] Semua langkah sudah di-push langsung ke `main`
