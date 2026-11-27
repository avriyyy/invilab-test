wajibLogin();
const saya = userSaatIni();
const sayaAdmin = saya && saya.role === "admin";
let idEdit = null;

if (sayaAdmin) document.getElementById("tombol-tambah").style.display = "inline-block";
else document.getElementById("kolom-aksi").style.display = "none";

async function muatKategori() {
  const data = await api("/api/kategori");
  document.getElementById("tabel-kategori").innerHTML = data.data.map((k) => `
    <tr>
      <td>${k.nama}</td>
      <td>${k.deskripsi || "-"}</td>
      ${sayaAdmin ? `<td>
        <button class="kecil" onclick='isiForm(${JSON.stringify(k)})'>Ubah</button>
        <button class="kecil danger" onclick="hapusKategori(${k.id})">Hapus</button>
      </td>` : ""}
    </tr>`).join("") || `<tr><td colspan="3" class="tengah">Belum ada kategori.</td></tr>`;
}

function bukaForm() {
  idEdit = null;
  document.getElementById("judul-form").textContent = "Tambah Kategori";
  document.getElementById("form-kategori").reset();
  document.getElementById("card-form").style.display = "block";
}

function isiForm(k) {
  idEdit = k.id;
  document.getElementById("judul-form").textContent = "Ubah Kategori";
  document.getElementById("nama").value = k.nama;
  document.getElementById("deskripsi").value = k.deskripsi || "";
  document.getElementById("card-form").style.display = "block";
}

function tutupForm() {
  document.getElementById("card-form").style.display = "none";
}

async function hapusKategori(id) {
  if (!confirm("Hapus kategori ini?")) return;
  try {
    await api(`/api/kategori/${id}`, { method: "DELETE" });
    tampilPesan(document.getElementById("pesan"), "Kategori berhasil dihapus.");
    muatKategori();
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
}

document.getElementById("form-kategori").addEventListener("submit", async (e) => {
  e.preventDefault();
  const isi = {
    nama: document.getElementById("nama").value.trim(),
    deskripsi: document.getElementById("deskripsi").value.trim(),
  };
  try {
    if (idEdit) await api(`/api/kategori/${idEdit}`, { method: "PUT", body: JSON.stringify(isi) });
    else await api("/api/kategori", { method: "POST", body: JSON.stringify(isi) });
    tampilPesan(document.getElementById("pesan"), "Kategori berhasil disimpan.");
    tutupForm();
    muatKategori();
  } catch (err) {
    tampilPesan(document.getElementById("pesan"), err.message, false);
  }
});

muatKategori().catch((err) =>
  tampilPesan(document.getElementById("pesan"), err.message, false));
