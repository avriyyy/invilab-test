import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  Konfirmasi,
  Pagination,
  Pesan,
  inputCls,
  labelCls,
  tombolHapus,
  tombolKecil,
  tombolPrimer,
  usePesanState,
} from "../components/ui";

function tanggal(iso) {
  return iso ? iso.slice(0, 10) : "-";
}

const BATAS = 10;

export default function Peminjaman() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const { pesan, setPesan, gagal, setGagal } = usePesanState();
  const [daftar, setDaftar] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState("");
  const [memuat, setMemuat] = useState(true);
  const [hapusTarget, setHapusTarget] = useState(null);

  const muat = useCallback(
    async (hal = 1) => {
      setMemuat(true);
      try {
        const data = await api(`/api/peminjaman?page=${hal}&limit=${BATAS}&status=${filterStatus}`);
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
    [filterStatus, setPesan, setGagal]
  );

  useEffect(() => {
    muat(1);
  }, [muat]);

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Daftar Peminjaman</h2>
        <Link to="/peminjaman/tambah" className={tombolPrimer}>
          Pinjam Barang
        </Link>
      </div>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                {sayaAdmin && <th className="px-3 py-2 text-right">Aksi</th>}
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
                    <td className="px-3 py-2 whitespace-nowrap">{tanggal(p.tanggal_pinjam)}</td>
                    <td className="px-3 py-2 whitespace-nowrap">{tanggal(p.tanggal_kembali)}</td>
                    <td className="px-3 py-2">
                      <Badge warna={p.status === "Dipinjam" ? "biru" : "hijau"}>{p.status}</Badge>
                    </td>
                    {sayaAdmin && (
                      <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                        <Link to={`/peminjaman/${p.id}/ubah`} className={tombolKecil}>
                          Ubah
                        </Link>
                        {p.status === "Dipinjam" && (
                          <button onClick={() => tandaiKembali(p)} className={tombolKecil}>
                            Tandai kembali
                          </button>
                        )}
                        <button onClick={() => setHapusTarget(p)} className={tombolHapus}>
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
          satuan="peminjaman"
          onPindah={muat}
        />
      </div>

      <Konfirmasi
        terbuka={Boolean(hapusTarget)}
        judul="Hapus Peminjaman"
        pesan={
          hapusTarget
            ? `Hapus peminjaman ${hapusTarget.nama_peminjam} (${hapusTarget.barang ? hapusTarget.barang.nama : ""})? Tindakan ini tidak bisa dibatalkan.`
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
