wajibLogin();
const saya = userSaatIni();
const sayaAdmin = saya && saya.role === "admin";
let halaman = 1;
let totalHalaman = 1;

if (!sayaAdmin) document.getElementById("kolom-aksi").style.display = "none";

function tanggal(iso) {
  return iso ? iso.slice(0, 10) : "-";
}

async function muatBarangPilih() {
  const data = await api("/api/barang?page=1&limit=100");
  const pilih = document.getElementById("barang");
  pilih.innerHTML = (data.data.items || []).map((b) => `<option value="${b.id}">${b.nama} (${b.kode_barang})</option>`).join("");
}

async function muatPeminjaman(hal = 1) {
  halaman = hal;
  const status = document.getElementById("filter-status").value;
  const data = await api(`/api/peminjaman?page=${halaman}&limit=10&status=${status}`);
  const items = data.data.items || [];
  totalHalaman = data.data.pagination.total_page;
  document.getElementById("info-halaman").textContent = `Halaman ${halaman} dari ${totalHalaman} (${data.data.pagination.total} peminjaman)`;
  document.getElementById("tombol-sebelum").disabled = halaman <= 1;
  document.getElementById("tombol-berikut").disabled = halaman >= totalHalaman;
  document.getElementById("tabel-peminjaman").innerHTML = items.map((p) => `
    <tr>
      <td>${p.barang ? p.barang.nama : "-"}</td>
      <td>${p.nama_peminjam}</td>
      <td>${p.nim}</td>
      <td>${tanggal(p.tanggal_pinjam)}</td>
      <td>${tanggal(p.tanggal_kembali)}</td>
      <td><span class="tag">${p.status}</span></td>
      ${sayaAdmin ? `<td>
        ${p.status === "Dipinjam" ? `<button class="kecil" onclick="tandaiKembali(${p.id})">Tandai kembali</button>` : ""}
        <button class="kecil danger" onclick="hapusPeminjaman(${p.id})">Hapus</button>
      </td>` : ""}
    </tr>`).join("") || `<tr><td colspan="7" class="tengah">Belum ada peminjaman.</td></tr>`;
}

function gantiHalaman(arah) {
  const tujuan = halaman + arah;
  if (tujuan >= 1 && tujuan <= totalHalaman) muatPeminjaman(tujuan);
}

async function tandaiKembali(id) {
  const hariIni = new Date().toISOString().slice(0, 10);
  try {
    const data = await api(`/api/peminjaman/${id}`);
    const p = data.data;
    await api(`/api/peminjaman/${id}`, {
      method: "PUT",
      body: JSON.stringify({
        barang_id: p.barang_id,
        nama_peminjam: p.nama_peminjam,
        nim: p.nim,
        tanggal_pinjam: tanggal(p.tanggal_pinjam),
        tanggal_kembali: hariIni,
        status: "Dikembalikan",
      }),
    });
    tampilPesan(document.getElementById("pesan"), "Peminjaman ditandai sudah dikembalikan.");
    muatPeminjaman(halaman);
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
}

async function hapusPeminjaman(id) {
  if (!confirm("Hapus peminjaman ini?")) return;
  try {
    await api(`/api/peminjaman/${id}`, { method: "DELETE" });
    tampilPesan(document.getElementById("pesan"), "Peminjaman berhasil dihapus.");
    muatPeminjaman(halaman);
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
}

document.getElementById("form-peminjaman").addEventListener("submit", async (e) => {
  e.preventDefault();
  const isi = {
    barang_id: parseInt(document.getElementById("barang").value, 10),
    nama_peminjam: document.getElementById("nama-peminjam").value.trim(),
    nim: document.getElementById("nim").value.trim(),
    tanggal_pinjam: document.getElementById("tanggal-pinjam").value,
  };
  try {
    await api("/api/peminjaman", { method: "POST", body: JSON.stringify(isi) });
    tampilPesan(document.getElementById("pesan"), "Peminjaman berhasil dibuat.");
    e.target.reset();
    muatPeminjaman(halaman);
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
});

muatBarangPilih().then(() => muatPeminjaman(1)).catch((err) =>
  tampilPesan(document.getElementById("pesan"), err.message, false));
