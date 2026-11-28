# 00 - Inisialisasi Proyek & Aturan Kelompok

Dokumen ini dibaca semua anggota sebelum mulai. Tujuannya satu: environment sama, repo sama, alur git sama, dan tiap jobdesk bisa kerja paralel tanpa menunggu yang lain.

Repo: `https://github.com/avriyyy/praktikum_pemweb2-responsi2-a3.git` (branch `main`). Aplikasi yang dibangun: **InviLab**, inventaris laboratorium (barang, peminjaman, kategori) dengan backend Go Fiber v3 + frontend Vite + React.

## 1. Spesifikasi dependency (wajib sama)

| Tools | Versi minimal |
| ----- | ------------- |
| Go | >= 1.26 (`go version`, go.mod menulis `go 1.26.0`) |
| Node.js | >= 20 LTS, disarankan 24 (`node -v`) |
| MySQL 8 / MariaDB | untuk basis data lokal (`docker compose up -d db` memakai MySQL 8.0) |
| Git | wajib |

Kenapa disamakan: beda versi Go bikin build gagal (`go.mod requires go >= 1.26.0`), beda versi Node bikin `package-lock.json` konflik.

## 2. Proyek awal

Clone lalu siapkan `.env` sendiri (jangan commit `.env`):

```bash
git clone https://github.com/avriyyy/praktikum_pemweb2-responsi2-a3.git
cd praktikum_pemweb2-responsi2-a3
```

Struktur repo (yang dikerjakan ada di `backend/` dan `frontend/`):

```text
praktikum_pemweb2-responsi2-a3/
  README.md
  docker-compose.yml        # MySQL lokal untuk development
  backend/                  # Go Fiber v3 + GORM
    go.mod
    cmd/api/main.go
    internal/config/ internal/model/ internal/handler/
    internal/middleware/ internal/router/ internal/seed/
  frontend/                 # Vite 8 + React 19 + Tailwind CSS v4
    package.json  vite.config.js  index.html
    src/main.jsx  src/App.jsx  src/index.css
    src/lib/api.js  src/context/AuthContext.jsx
    src/components/  src/pages/
  responsi/                 # panduan ini
```

**Path:** `.gitignore` (sudah ada di root repo, jangan diubah):

```
.env
invilab-api
*.log
.DS_Store
```

**Path:** `.dockerignore` (sudah ada di root repo, jangan diubah):

```
.git
frontend/node_modules
frontend/dist
backend/.env
*.log
shots
```

Basis data lokal pakai file berikut (sudah ada di repo):

**Path:** `docker-compose.yml`

```yaml
services:
  db:
    image: mysql:8.0
    container_name: invilab-db
    environment:
      MYSQL_ROOT_PASSWORD: root
      MYSQL_DATABASE: invilab
    ports:
      - "3306:3306"
    volumes:
      - invilab-db-data:/var/lib/mysql
    healthcheck:
      test: ["CMD", "mysqladmin", "ping", "-h", "localhost", "-u", "root", "-proot"]
      interval: 5s
      timeout: 5s
      retries: 10

volumes:
  invilab-db-data:
```

```bash
docker compose up -d db   # MySQL lokal di 127.0.0.1:3306, database invilab
```

Siapkan environment backend (dibuat sendiri dari contoh, jangan di-commit):

```bash
cp backend/.env.example backend/.env
# isi DB_PASSWORD dan JWT_SECRET di backend/.env
# JWT_SECRET: nilai acak yang panjang, contoh: openssl rand -hex 32
```

Siapkan dependency (file lock dibuat otomatis, jangan ditulis manual):

```bash
cd backend && go mod tidy   # membuat backend/go.sum
cd ../frontend && npm install   # membuat frontend/package-lock.json
```

## 3. Kontrak bersama (dibaca semua anggota)

Kontrak ini yang membuat tiap jobdesk bisa kerja paralel. Jangan ubah kontrak tanpa sepakat bertiga.

### 3.1 Format respons API

Semua endpoint menjawab JSON dengan bentuk yang sama:

```json
{ "success": true, "message": "...", "data": ... }
```

Error: `success` false, `message` berisi pesan bahasa Indonesia, tanpa detail error internal. Daftar memakai bentuk:

```json
{ "success": true, "message": "...", "data": { "items": [ ... ], "pagination": { "page": 1, "limit": 10, "total": 8, "total_page": 1 } } }
```

### 3.2 Tabel route API (lengkap, jangan diubah)

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
| GET | /api/kategori?page=&limit= | Daftar kategori | Ya | Semua |
| GET | /api/kategori/:id | Detail kategori + barang | Ya | Semua |
| POST | /api/kategori | Tambah kategori | Ya | Admin |
| PUT | /api/kategori/:id | Ubah kategori | Ya | Admin |
| DELETE | /api/kategori/:id | Hapus kategori | Ya | Admin |
| GET | /api/peminjaman?status=&page=&limit= | Daftar peminjaman + barang | Ya | Semua |
| GET | /api/peminjaman/:id | Detail peminjaman + barang | Ya | Semua |
| POST | /api/peminjaman | Buat peminjaman | Ya | Semua |
| PUT | /api/peminjaman/:id | Ubah peminjaman | Ya | Admin |
| DELETE | /api/peminjaman/:id | Hapus peminjaman | Ya | Admin |

### 3.3 Field tiap model (JSON)

**User** (`users`): `id`, `nama`, `email` (unik), `password` (tidak pernah muncul di respons, `json:"-"`), `role` (`admin` atau `anggota`, default `anggota`), `created_at`, `updated_at`. Soft delete aktif.

**Kategori** (`kategoris`): `id`, `nama` (unik), `deskripsi`, `barang` (daftar barang, hanya di detail), `created_at`, `updated_at`. Soft delete aktif.

**Barang** (`barangs`): `id`, `kode_barang` (unik), `nama`, `kategori_id`, `kategori` (objek kategori hasil Preload), `jumlah`, `kondisi` (`Baik`, `Rusak`, atau `Perawatan`), `lokasi`, `created_at`, `updated_at`. Soft delete aktif.

**Peminjaman** (`peminjamans`): `id`, `barang_id`, `barang` (objek barang hasil Preload), `nama_peminjam`, `nim`, `tanggal_pinjam` (`YYYY-MM-DD`), `tanggal_kembali` (boleh kosong), `status` (`Dipinjam` atau `Dikembalikan`, default `Dipinjam`), `created_at`, `updated_at`. Soft delete aktif.

### 3.4 Helper backend (kontrak, jangan ubah signature)

File `backend/internal/handler/response.go` (milik jobdesk-1):

- `Sukses(c, status, pesan, data)` - respons berhasil `{success: true, message, data}`.
- `Gagal(c, status, pesan)` - respons error `{success: false, message}`.
- `Validasi(c, req)` - validasi struct request, jawab 422 dengan pesan bahasa Indonesia kalau tidak valid, kembalikan `false`.
- `Pagination(c)` - baca query `page` dan `limit`, kembalikan `(page, limit, offset)`. Default page 1, limit 10, limit maksimal 100.
- `MetaPagination(page, limit, total)` - kembalikan `{"page", "limit", "total", "total_page"}`.

### 3.5 Klien API frontend (kontrak, jangan ubah signature)

File `frontend/src/lib/api.js` (milik jobdesk-2):

- `api(path, options = {})` - `fetch` ke `VITE_API_URL + path`, kirim token JWT sebagai `Authorization: Bearer <token>` kalau ada. Kalau server menjawab 401, sesi dihapus dan pengguna dilempar ke `/login`, lalu error dilempar dengan pesan dari server.
- `simpanSesi(token, user)`, `hapusSesi()`, `penggunaSaatIni()` - simpan/baca sesi di `localStorage` (kunci `token` dan `user`).
- `VITE_API_URL` dibaca dari env, default `http://localhost:3000`.

File `frontend/src/context/AuthContext.jsx` (milik jobdesk-2):

- `useAuth()` mengembalikan `{ user, login, register, logout }`.
- `user` berbentuk `{ id, nama, email, role }` atau `null` kalau belum login.
- `login(email, password)` memanggil `POST /api/auth/login` lalu menyimpan sesi.
- `register(nama, email, password)` memanggil `POST /api/auth/register`.
- `logout()` memanggil `POST /api/auth/logout` lalu menghapus sesi.

### 3.6 Komponen UI bersama (kontrak, jangan ubah props)

File `frontend/src/components/ui.jsx` (milik jobdesk-3):

- `Pesan({ teks, gagal })` - kotak pesan hijau (berhasil) atau merah (gagal). Tidak tampil kalau `teks` kosong.
- `Badge({ children, warna })` - label kecil, `warna`: `hijau`, `kuning`, `merah`, `biru`, `abu`.
- `Pagination({ halaman, totalHalaman, total, batas = 10, satuan, onPindah })` - info `Menampilkan awal-akhir dari total satuan` di kiri, tombol Sebelumnya, nomor halaman, dan Berikutnya di kanan.
- `Konfirmasi({ terbuka, judul, pesan, onBatal, onYa, sedangProses })` - popup konfirmasi hapus. Tutup dengan tombol Batal, klik di luar popup, atau tombol Escape.
- `usePesanState()` - ambil pesan sukses dari halaman form (`location.state`), kembalikan `{ pesan, setPesan, gagal, setGagal }`.
- Class string: `inputCls`, `labelCls`, `tombolPrimer`, `tombolHapus`, `tombolHapusBesar`, `tombolKecil`, `tombolHantu`.

### 3.7 Aturan role

- Tulis data (POST, PUT, DELETE) hanya admin. Baca data boleh semua role yang sudah login.
- Pengecualian: `POST /api/peminjaman` boleh semua role yang sudah login (anggota meminjam barang).
- Pelanggaran role dijawab 403. Tanpa token dijawab 401.
- Middleware role ditulis SEBELUM handler di route. Kalau ditulis setelah handler, role tidak pernah diperiksa (Fiber v3 menjalankan handler sesuai urutan penulisan).
- Registrasi publik tidak boleh memilih role admin. Role akun baru selalu `anggota`.
- Di frontend, tombol tulis admin disembunyikan total untuk anggota (bukan dinonaktifkan). Route form admin dijaga `PerluAdmin` di `App.jsx` (bukan admin dilempar ke `/barang`).

### 3.8 Akun demo (dibuat otomatis oleh seed)

| Role | Email | Kata sandi |
|------|-------|------------|
| Admin | admin@invilab.test | admin123 |
| Anggota | anggota@invilab.test | anggota123 |

Akun demo hanya untuk pengujian. Seed memastikan akun ini ada di setiap boot (kalau rolenya salah, dibetulkan).

## 4. Kerja langsung di main (tanpa branch baru)

Tidak ada branch baru dan tidak ada Pull Request. Semua anggota kerja langsung di branch `main` supaya cepat. Caranya:

```bash
git checkout main && git pull   # selalu pull dulu sebelum mulai kerja
# ... kerjakan 1 langkah besar ...
git add <file yang diubah>
git commit -m "tipe: penjelasan singkat"
git push   # langsung ke main
```

Kalau `git push` ditolak karena `main` sudah maju (teman sudah push duluan): `git pull` dulu, selesaikan konflik kalau ada, lalu `git push` lagi. Jangan pakai `git push --force`.

**Urutan kerja (sampai mana push ke main):**

| Jobdesk | Push ke main saat |
| ------ | ------------------ |
| `jobdesk-1` | Checklist serah terima jobdesk-1 hijau: `go build ./...` lolos, `GET /api/status` 200, `GET /api/barang` menjawab bentuk pagination |
| `jobdesk-2` | Kerja dari `main` yang sudah ada `jobdesk-1`; push saat checklist serah terima jobdesk-2 hijau (login 2 role, 403 anggota, CRUD peminjaman lolos curl) |
| `jobdesk-3` | Kerja dari `main` yang sudah ada `jobdesk-1`; push saat checklist akhir hijau + `npm run build` lolos + verifikasi akhir di jobdesk-3 hijau |

Aturan: `jobdesk-1` dulu (fondasi). `jobdesk-2` dan `jobdesk-3` mulai setelah `jobdesk-1` di-push ke `main`, dan kerja paralel dari `main` terbaru. Sebelum mulai tiap langkah, `git pull` dulu supaya kamu kerja dari `main` terbaru.

**Titik gabung (file bersama, satu pemilik per file):**

| File | Pemilik | Yang ditambahkan jobdesk lain (hanya di titik yang ditandai di md-nya) |
| ---- | ------- | ------- |
| `backend/internal/model/models.go` | Jobdesk 1 (kerangka + Barang + struct Kategori + struct Peminjaman) | Jobdesk 2: struct User, request auth + peminjaman. Jobdesk 3: request kategori (struct Kategori dan Peminjaman sudah ada di kerangka; Kategori dipakai foreign key Barang, Peminjaman dipakai guard hapus Barang) |
| `backend/internal/router/router.go` | Jobdesk 1 (status + barang) | Jobdesk 2: route `/api/auth` + `/api/peminjaman`. Jobdesk 3: route `/api/kategori` |
| `backend/cmd/api/main.go` | Jobdesk 1 | Jobdesk 2 dan 3: tambah model di baris `AutoMigrate` |
| `backend/internal/seed/seed.go` | Jobdesk 1 (seed barang) | Jobdesk 2: akun demo + seed peminjaman. Jobdesk 3: seed kategori |
| `frontend/src/App.jsx` | Jobdesk 3 | - (dibaca kontrak route di bagian 3, ditulis penuh oleh jobdesk 3) |
| `README.md` | Jobdesk 3 (update jobdesk + video) | - |

Kalau dua anggota mengubah baris yang sama di file bersama (misal baris `AutoMigrate` di `main.go`), yang push belakangan menyelesaikan konflik saat `git pull` dengan memakai baris final yang tertulis di md jobdesk-3. Isi file final harus sama persis dengan yang ada di repo ini sekarang.

## 5. Aturan commit & push

Format pesan: `tipe: penjelasan singkat`

| Tipe | Pakai untuk |
| ---- | ----------- |
| `feat` | fitur baru |
| `fix` | perbaikan bug |
| `chore` | setup, config, dependency |
| `docs` | dokumentasi |

Contoh: `feat: tambah CRUD Barang + pagination`, `fix: anggota tidak boleh hapus barang`.

**Kapan push:** setiap 1 langkah besar selesai DAN sudah lolos cek di bawah. Jangan menumpuk 10 file tanpa commit.

Cek wajib sebelum push:

```bash
# backend (dari folder backend/)
go build ./...
go vet ./...

# frontend (dari folder frontend/)
npm run build
```

Push langsung ke `main` setelah tiap langkah besar selesai dan lolos cek. Konflik `go.sum` atau `package-lock.json`: jangan edit manual, jalankan `go mod tidy` atau `npm install` lalu commit hasilnya.

## 6. Pembagian kerja (detail di file masing-masing)

| File | Jobdesk | Fokus | CRUD miliknya |
| ---- | ------- | ----- | ------------- |
| `jobdesk-1.md` | 1 | Fondasi backend, config, respons, model, seed, Docker backend | **Barang** (API + halaman daftar + form) |
| `jobdesk-2.md` | 2 | Middleware auth, autentikasi, klien API, AuthContext, halaman auth | **Peminjaman** (API + halaman daftar + form) |
| `jobdesk-3.md` | 3 | Kategori, komponen UI, layout, routing, skeleton frontend, README, cek akhir | **Kategori** (API + halaman daftar + form) |

Aturan: tiap jobdesk memegang minimal 1 fitur CRUD end-to-end (backend API + halaman frontend). Pembagian di atas memenuhi: jobdesk-1 = Barang, jobdesk-2 = Peminjaman, jobdesk-3 = Kategori. Deployment dan integrasi dibagi bersama setelah jobdesk di atas selesai.

Urutan kerjakan: **jobdesk-1 dulu** (fondasi), lalu `jobdesk-2` dan `jobdesk-3` paralel dari `main` terbaru. Tiap file berisi langkah berurutan, path file, kode lengkap, dan saran commit/push.
