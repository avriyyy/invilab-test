wajibLogin();
const saya = userSaatIni();
const sayaAdmin = saya && saya.role === "admin";
let halaman = 1;
let totalHalaman = 1;
let idEdit = null;

if (sayaAdmin) document.getElementById("tombol-tambah").style.display = "inline-block";
else document.getElementById("kolom-aksi").style.display = "none";

async function muatKategori() {
  const data = await api("/api/kategori");
  const pilih = document.getElementById("kategori");
  pilih.innerHTML = data.data.map((k) => `<option value="${k.id}">${k.nama}</option>`).join("");
}

async function muatBarang(hal = 1) {
  halaman = hal;
  const cari = document.getElementById("cari").value.trim();
  const data = await api(`/api/barang?page=${halaman}&limit=10&search=${encodeURIComponent(cari)}`);
  const items = data.data.items || [];
  totalHalaman = data.data.pagination.total_page;
  document.getElementById("info-halaman").textContent = `Halaman ${halaman} dari ${totalHalaman} (${data.data.pagination.total} barang)`;
  document.getElementById("tombol-sebelum").disabled = halaman <= 1;
  document.getElementById("tombol-berikut").disabled = halaman >= totalHalaman;
  document.getElementById("tabel-barang").innerHTML = items.map((b) => `
    <tr>
      <td>${b.kode_barang}</td>
      <td>${b.nama}</td>
      <td>${b.kategori ? b.kategori.nama : "-"}</td>
      <td>${b.jumlah}</td>
      <td><span class="tag">${b.kondisi}</span></td>
      <td>${b.lokasi || "-"}</td>
      ${sayaAdmin ? `<td>
        <button class="kecil" onclick='isiForm(${JSON.stringify(b)})'>Ubah</button>
        <button class="kecil danger" onclick="hapusBarang(${b.id})">Hapus</button>
      </td>` : ""}
    </tr>`).join("") || `<tr><td colspan="7" class="tengah">Belum ada barang.</td></tr>`;
}

function gantiHalaman(arah) {
  const tujuan = halaman + arah;
  if (tujuan >= 1 && tujuan <= totalHalaman) muatBarang(tujuan);
}

function bukaForm() {
  idEdit = null;
  document.getElementById("judul-form").textContent = "Tambah Barang";
  document.getElementById("form-barang").reset();
  document.getElementById("card-form").style.display = "block";
}

function isiForm(b) {
  idEdit = b.id;
  document.getElementById("judul-form").textContent = "Ubah Barang";
  document.getElementById("kode").value = b.kode_barang;
  document.getElementById("nama").value = b.nama;
  document.getElementById("kategori").value = b.kategori_id;
  document.getElementById("jumlah").value = b.jumlah;
  document.getElementById("kondisi").value = b.kondisi;
  document.getElementById("lokasi").value = b.lokasi || "";
  document.getElementById("card-form").style.display = "block";
}

function tutupForm() {
  document.getElementById("card-form").style.display = "none";
}

async function hapusBarang(id) {
  if (!confirm("Hapus barang ini?")) return;
  try {
    await api(`/api/barang/${id}`, { method: "DELETE" });
    tampilPesan(document.getElementById("pesan"), "Barang berhasil dihapus.");
    muatBarang(halaman);
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
}

document.getElementById("form-barang").addEventListener("submit", async (e) => {
  e.preventDefault();
  const isi = {
    kode_barang: document.getElementById("kode").value.trim(),
    nama: document.getElementById("nama").value.trim(),
    kategori_id: parseInt(document.getElementById("kategori").value, 10),
    jumlah: parseInt(document.getElementById("jumlah").value, 10),
    kondisi: document.getElementById("kondisi").value,
    lokasi: document.getElementById("lokasi").value.trim(),
  };
  try {
    if (idEdit) await api(`/api/barang/${idEdit}`, { method: "PUT", body: JSON.stringify(isi) });
    else await api("/api/barang", { method: "POST", body: JSON.stringify(isi) });
    tampilPesan(document.getElementById("pesan"), "Barang berhasil disimpan.");
    tutupForm();
    muatBarang(halaman);
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
});

muatKategori().then(() => muatBarang(1)).catch((err) =>
  tampilPesan(document.getElementById("pesan"), err.message, false));
