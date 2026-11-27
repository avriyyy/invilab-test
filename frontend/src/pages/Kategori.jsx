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
