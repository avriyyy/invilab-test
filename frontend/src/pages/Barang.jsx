import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Badge,
  Pagination,
  Pesan,
  inputCls,
  labelCls,
  tombolHapus,
  tombolKecil,
  tombolPrimer,
  usePesanState,
} from "../components/ui";

const warnaKondisi = { Baik: "hijau", Rusak: "merah", Perawatan: "kuning" };
const BATAS = 10;

export default function Barang() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const { pesan, setPesan, gagal, setGagal } = usePesanState();
  const [daftar, setDaftar] = useState([]);
  const [halaman, setHalaman] = useState(1);
  const [totalHalaman, setTotalHalaman] = useState(1);
  const [total, setTotal] = useState(0);
  const [cari, setCari] = useState("");
  const [memuat, setMemuat] = useState(true);

  const muat = useCallback(
    async (hal = 1) => {
      setMemuat(true);
      try {
        const data = await api(
          `/api/barang?page=${hal}&limit=${BATAS}&search=${encodeURIComponent(cari)}`
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
    [cari, setPesan, setGagal]
  );

  useEffect(() => {
    muat(1);
  }, [muat]);

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
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">Daftar Barang</h2>
        {sayaAdmin && (
          <Link to="/barang/tambah" className={tombolPrimer}>
            Tambah Barang
          </Link>
        )}
      </div>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
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
                      <td className="space-x-2 px-3 py-2 text-right whitespace-nowrap">
                        <Link to={`/barang/${b.id}/ubah`} className={tombolKecil}>
                          Ubah
                        </Link>
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

        <Pagination
          halaman={halaman}
          totalHalaman={totalHalaman}
          total={total}
          batas={BATAS}
          satuan="barang"
          onPindah={muat}
        />
      </div>
    </div>
  );
}
