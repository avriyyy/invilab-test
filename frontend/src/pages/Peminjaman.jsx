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

function tanggal(iso) {
  return iso ? iso.slice(0, 10) : "-";
}

export default function Peminjaman() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const [daftar, setDaftar] = useState([]);
  const [barang, setBarang] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState("");
  const [gagal, setGagal] = useState(false);
  const [form, setForm] = useState({ barang_id: "", nama_peminjam: "", nim: "", tanggal_pinjam: "" });

  const muat = useCallback(
    async (hal = 1) => {
      setMemuat(true);
      try {
        const data = await api(`/api/peminjaman?page=${hal}&limit=10&status=${filterStatus}`);
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
    [filterStatus]
  );

  useEffect(() => {
    api("/api/barang?page=1&limit=100")
      .then((data) => setBarang(data.data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    muat(1);
  }, [muat]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setGagal(false);
    const isi = {
      barang_id: parseInt(form.barang_id, 10),
      nama_peminjam: form.nama_peminjam.trim(),
      nim: form.nim.trim(),
      tanggal_pinjam: form.tanggal_pinjam,
    };
    try {
      await api("/api/peminjaman", { method: "POST", body: JSON.stringify(isi) });
      setPesan("Peminjaman berhasil dibuat.");
      setForm({ barang_id: "", nama_peminjam: "", nim: "", tanggal_pinjam: "" });
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  async function tandaiKembali(p) {
    const hariIni = new Date().toISOString().slice(0, 10);
    try {
      await api(`/api/peminjaman/${p.id}`, {
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
      setPesan("Peminjaman ditandai sudah dikembalikan.");
      setGagal(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  async function hapus(id) {
    if (!confirm("Hapus peminjaman ini?")) return;
    try {
      await api(`/api/peminjaman/${id}`, { method: "DELETE" });
      setPesan("Peminjaman berhasil dihapus.");
      setGagal(false);
      muat(halaman);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Daftar Peminjaman</h2>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="max-w-xs">
          <label htmlFor="filter-status" className={labelCls}>
            Status
          </label>
          <select
            id="filter-status"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className={inputCls}
          >
            <option value="">Semua</option>
            <option>Dipinjam</option>
            <option>Dikembalikan</option>
          </select>
        </div>

        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2">Barang</th>
                <th className="px-3 py-2">Peminjam</th>
                <th className="px-3 py-2">NIM</th>
                <th className="px-3 py-2">Tgl Pinjam</th>
                <th className="px-3 py-2">Tgl Kembali</th>
                <th className="px-3 py-2">Status</th>
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
                    Belum ada peminjaman.
                  </td>
                </tr>
              ) : (
                daftar.map((p) => (
                  <tr key={p.id} className="border-t border-slate-200">
                    <td className="px-3 py-2">{p.barang ? p.barang.nama : "-"}</td>
                    <td className="px-3 py-2">{p.nama_peminjam}</td>
                    <td className="px-3 py-2">{p.nim}</td>
                    <td className="px-3 py-2">{tanggal(p.tanggal_pinjam)}</td>
                    <td className="px-3 py-2">{tanggal(p.tanggal_kembali)}</td>
                    <td className="px-3 py-2">
                      <Badge warna={p.status === "Dipinjam" ? "biru" : "hijau"}>{p.status}</Badge>
                    </td>
                    {sayaAdmin && (
                      <td className="space-x-2 px-3 py-2">
                        {p.status === "Dipinjam" && (
                          <button onClick={() => tandaiKembali(p)} className={tombolKecil}>
                            Tandai kembali
                          </button>
                        )}
                        <button onClick={() => hapus(p.id)} className={tombolHapus}>
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
            Halaman {halaman} dari {totalHalaman} ({total} peminjaman)
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

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <h3 className="mb-3 text-lg font-semibold">Pinjam Barang</h3>
        <form onSubmit={simpan} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="barang" className={labelCls}>
                Barang
              </label>
              <select
                id="barang"
                required
                value={form.barang_id}
                onChange={(e) => setForm({ ...form, barang_id: e.target.value })}
                className={inputCls}
              >
                <option value="">Pilih barang</option>
                {barang.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.nama} ({b.kode_barang})
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="nama-peminjam" className={labelCls}>
                Nama peminjam
              </label>
              <input
                id="nama-peminjam"
                required
                value={form.nama_peminjam}
                onChange={(e) => setForm({ ...form, nama_peminjam: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="nim" className={labelCls}>
                NIM
              </label>
              <input
                id="nim"
                required
                value={form.nim}
                onChange={(e) => setForm({ ...form, nim: e.target.value })}
                className={inputCls}
              />
            </div>
            <div>
              <label htmlFor="tanggal-pinjam" className={labelCls}>
                Tanggal pinjam
              </label>
              <input
                id="tanggal-pinjam"
                type="date"
                required
                value={form.tanggal_pinjam}
                onChange={(e) => setForm({ ...form, tanggal_pinjam: e.target.value })}
                className={inputCls}
              />
            </div>
          </div>
          <button type="submit" className={tombolPrimer}>
            Buat Peminjaman
          </button>
        </form>
      </div>
    </div>
  );
}
