# InviLab - Inventaris Laboratorium

Aplikasi web untuk mencatat barang laboratorium, peminjaman barang, dan kategorinya.
Dibangun untuk Responsi 2 Praktikum Pemrograman Web 2 (Go Fiber).

Backend REST API Go Fiber v3 + GORM, frontend Vite + React + Tailwind CSS,
autentikasi JWT dengan 2 role (admin dan anggota).

## Anggota dan Jobdesk

| Anggota | Jobdesk |
|---------|---------|
| (diisi kelompok) | Jobdesk 1: fondasi backend + CRUD Barang, termasuk pagination + pencarian di GET /api/barang |
| (diisi kelompok) | Jobdesk 2: autentikasi (admin + anggota) + CRUD Peminjaman, termasuk relasi Preload Barang |
| (diisi kelompok) | Jobdesk 3: CRUD Kategori + frontend dan integrasi (halaman ketiga resource, integrasi FE-BE) |

Deployment dan integrasi dibagi bersama setelah jobdesk di atas selesai.

## Teknologi

- Backend: Go 1.26, Fiber v3, GORM, MySQL, JWT (golang-jwt), bcrypt
- Frontend: Vite 8, React 19, React Router 7, Tailwind CSS v4
- Basis data: MySQL 8 / MariaDB

## Cara Menjalankan

### Backend

```bash
cd backend
cp .env.example .env
# isi DB_PASSWORD dan JWT_SECRET di .env
go mod tidy
go run ./cmd/api
```

API berjalan di `http://localhost:3000`. Saat pertama jalan dengan basis data
kosong, aplikasi otomatis membuat akun demo dan data contoh.

Butuh MySQL lokal? Jalankan:

```bash
docker compose up -d db
```

### Frontend

```bash
cd frontend
cp .env.example .env
# isi VITE_API_URL kalau API tidak di http://localhost:3000
npm install
npm run dev
```

Lalu buka `http://localhost:8080`. Dev server berjalan di port 8080 supaya
origin-nya cocok dengan `FRONTEND_URL` di `.env` backend (CORS backend hanya
mengizinkan origin itu). Untuk build produksi: `npm run build`, hasilnya di
folder `frontend/dist/`.

## Akun Demo

| Role | Email | Kata sandi |
|------|-------|------------|
| Admin | admin@invilab.test | admin123 |
| Anggota | anggota@invilab.test | anggota123 |

Akun demo hanya untuk pengujian. Registrasi publik selalu membuat akun anggota,
tidak bisa memilih role admin.

## URL Deployment

- Frontend: https://invilab.apriyudha.my.id
- Backend: https://api-invilab.apriyudha.my.id

## Dokumentasi API

Format respons: `{ "success": true/false, "message": "...", "data": ... }`.
Request terlindungi mengirim header `Authorization: Bearer <token>`.

| Method | Endpoint | Keterangan | Auth | Role |
|--------|----------|------------|------|------|
| GET | /api/status | Cek API hidup | Tidak | - |
| POST | /api/auth/register | Registrasi (role selalu anggota) | Tidak | - |
| POST | /api/auth/login | Login, mengembalikan JWT | Tidak | - |
| GET | /api/auth/profile | Profil pengguna login | Ya | Semua |
| POST | /api/auth/logout | Logout (token dihapus di frontend) | Ya | Semua |
| GET | /api/barang?search=&page=&limit= | Daftar barang, pagination + pencarian | Ya | Semua |
| GET | /api/barang/:id | Detail barang + kategori | Ya | Semua |
| POST | /api/barang | Tambah barang | Ya | Admin |
| PUT | /api/barang/:id | Ubah barang | Ya | Admin |
| DELETE | /api/barang/:id | Hapus barang | Ya | Admin |
| GET | /api/kategori | Daftar kategori | Ya | Semua |
| GET | /api/kategori/:id | Detail kategori + barang | Ya | Semua |
| POST | /api/kategori | Tambah kategori | Ya | Admin |
| PUT | /api/kategori/:id | Ubah kategori | Ya | Admin |
| DELETE | /api/kategori/:id | Hapus kategori | Ya | Admin |
| GET | /api/peminjaman?status= | Daftar peminjaman + barang | Ya | Semua |
| GET | /api/peminjaman/:id | Detail peminjaman + barang | Ya | Semua |
| POST | /api/peminjaman | Buat peminjaman | Ya | Semua |
| PUT | /api/peminjaman/:id | Ubah peminjaman | Ya | Admin |
| DELETE | /api/peminjaman/:id | Hapus peminjaman | Ya | Admin |

## Video Presentasi

(menyusul)
