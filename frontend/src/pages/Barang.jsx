import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  Pesan,
  inputCls,
  labelCls,
  tombolHantu,
  tombolHapus,
  tombolKecil,
  tombolPrimer,
} from "../components/ui";

const warnaKondisi = { Baik: "hijau", Rusak: "merah", Perawatan: "kuning" };
const formAwal = { kode_barang: "", nama: "", kategori_id: "", jumlah: 1, kondisi: "Baik", lokasi: "" };

export default function Barang() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const [daftar, setDaftar] = useState([]);
  const [kategori, setKategori] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [cari, setCari] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState("");
  const [gagal, setGagal] = useState(false);
  const [tampilForm, setTampilForm] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [form, setForm] = useState(formAwal);

  const muat = useCallback(
    async (hal = 1) => {
      setMemuat(true);
      try {
        const data = await api(
          `/api/barang?page=${hal}&limit=10&search=${encodeURIComponent(cari)}`
        );
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
    },
    [cari]
  );

  useEffect(() => {
    api("/api/kategori")
      .then((data) => setKategori(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    muat(1);
  }, [muat]);

  function bukaForm() {
    setIdEdit(null);
    setForm(formAwal);
    setTampilForm(true);
  }

  function isiForm(b) {
    setIdEdit(b.id);
    setForm({
      kode_barang: b.kode_barang,
      nama: b.nama,
      kategori_id: String(b.kategori_id),
      jumlah: b.jumlah,
      kondisi: b.kondisi,
      lokasi: b.lokasi || "",
    });
    setTampilForm(true);
  }

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setGagal(false);
    const isi = {
      kode_barang: form.kode_barang.trim(),
      nama: form.nama.trim(),
      kategori_id: parseInt(form.kategori_id, 10),
      jumlah: parseInt(form.jumlah, 10),
      kondisi: form.kondisi,
      lokasi: form.lokasi.trim(),
    };
    try {
      if (idEdit) {
        await api(`/api/barang/${idEdit}`, { method: "PUT", body: JSON.stringify(isi) });
      } else {
        await api("/api/barang", { method: "POST", body: JSON.stringify(isi) });
      }
      setPesan("Barang berhasil disimpan.");
      setTampilForm(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  async function hapus(id) {
    if (!confirm("Hapus barang ini?")) return;
    try {
      await api(`/api/barang/${id}`, { method: "DELETE" });
      setPesan("Barang berhasil dihapus.");
      setGagal(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Daftar Barang</h2>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-wrap items-end gap-2">
          <div className="min-w-52 flex-1">
            <label htmlFor="cari" className={labelCls}>
              Cari barang
            </label>
            <input
              id="cari"
              type="text"
              placeholder="Nama atau kode barang"
              value={cari}
              onChange={(e) => setCari(e.target.value)}
              className={inputCls}
            />
          </div>
          <button onClick={() => muat(1)} className={tombolPrimer}>
            Cari
          </button>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2">Kode</th>
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Kategori</th>
                <th className="px-3 py-2">Jumlah</th>
                <th className="px-3 py-2">Kondisi</th>
                <th className="px-3 py-2">Lokasi</th>
                {sayaAdmin && <th className="px-3 py-2">Aksi</th>}
              </tr>
            </thead>
            <tbody>
              {memuat ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Memuat...
                  </td>
                </tr>
              ) : daftar.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-6 text-center text-slate-500">
                    Belum ada barang.
                  </td>
                </tr>
              ) : (
                daftar.map((b) => (
                  <tr key={b.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{b.kode_barang}</td>
                    <td className="px-3 py-2">{b.nama}</td>
                    <td className="px-3 py-2">{b.kategori ? b.kategori.nama : "-"}</td>
                    <td className="px-3 py-2">{b.jumlah}</td>
                    <td className="px-3 py-2">
                      <Badge warna={warnaKondisi[b.kondisi]}>{b.kondisi}</Badge>
                    </td>
                    <td className="px-3 py-2">{b.lokasi || "-"}</td>
                    {sayaAdmin && (
                      <td className="space-x-2 px-3 py-2">
                        <button onClick={() => isiForm(b)} className={tombolKecil}>
                          Ubah
                        </button>
                        <button onClick={() => hapus(b.id)} className={tombolHapus}>
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

        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => muat(halaman - 1)}
            disabled={halaman <= 1}
            className={`${tombolHantu} disabled:opacity-50`}
          >
            Sebelumnya
          </button>
          <span className="text-sm text-slate-600">
            Halaman {halaman} dari {totalHalaman} ({total} barang)
          </span>
          <button
            onClick={() => muat(halaman + 1)}
            disabled={halaman >= totalHalaman}
            className={`${tombolHantu} disabled:opacity-50`}
          >
            Berikutnya
          </button>
        </div>
      </div>

      {sayaAdmin && tampilForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">
            {idEdit ? "Ubah Barang" : "Tambah Barang"}
          </h3>
          <form onSubmit={simpan} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="kode" className={labelCls}>
                  Kode barang
                </label>
                <input
                  id="kode"
                  required
                  value={form.kode_barang}
                  onChange={(e) => setForm({ ...form, kode_barang: e.target.value })}
                  className={inputCls}
                />
              </div>
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
                <label htmlFor="kategori" className={labelCls}>
                  Kategori
                </label>
                <select
                  id="kategori"
                  required
                  value={form.kategori_id}
                  onChange={(e) => setForm({ ...form, kategori_id: e.target.value })}
                  className={inputCls}
                >
                  <option value="">Pilih kategori</option>
                  {kategori.map((k) => (
                    <option key={k.id} value={k.id}>
                      {k.nama}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="jumlah" className={labelCls}>
                  Jumlah
                </label>
                <input
                  id="jumlah"
                  type="number"
                  min={0}
                  required
                  value={form.jumlah}
                  onChange={(e) => setForm({ ...form, jumlah: e.target.value })}
                  className={inputCls}
                />
              </div>
              <div>
                <label htmlFor="kondisi" className={labelCls}>
                  Kondisi
                </label>
                <select
                  id="kondisi"
                  value={form.kondisi}
                  onChange={(e) => setForm({ ...form, kondisi: e.target.value })}
                  className={inputCls}
                >
                  <option>Baik</option>
                  <option>Rusak</option>
                  <option>Perawatan</option>
                </select>
              </div>
              <div>
                <label htmlFor="lokasi" className={labelCls}>
                  Lokasi
                </label>
                <input
                  id="lokasi"
                  placeholder="misal Lab A"
                  value={form.lokasi}
                  onChange={(e) => setForm({ ...form, lokasi: e.target.value })}
                  className={inputCls}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <button type="submit" className={tombolPrimer}>
                Simpan
              </button>
              <button type="button" onClick={() => setTampilForm(false)} className={tombolHantu}>
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {sayaAdmin && !tampilForm && (
        <button onClick={bukaForm} className={tombolPrimer}>
          Tambah Barang
        </button>
      )}
    </div>
  );
}
