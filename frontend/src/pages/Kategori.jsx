import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import {
  Pesan,
  inputCls,
  labelCls,
  tombolHantu,
  tombolHapus,
  tombolKecil,
  tombolPrimer,
} from "../components/ui";

export default function Kategori() {
  const { user } = useAuth();
  const sayaAdmin = user?.role === "admin";
  const [daftar, setDaftar] = useState([]);
  const [memuat, setMemuat] = useState(true);
  const [pesan, setPesan] = useState("");
  const [gagal, setGagal] = useState(false);
  const [tampilForm, setTampilForm] = useState(false);
  const [idEdit, setIdEdit] = useState(null);
  const [form, setForm] = useState({ nama: "", deskripsi: "" });

  async function muat() {
    setMemuat(true);
    try {
      const data = await api("/api/kategori");
      setDaftar(data.data || []);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    } finally {
      setMemuat(false);
    }
  }

  useEffect(() => {
    muat();
  }, []);

  function bukaForm() {
    setIdEdit(null);
    setForm({ nama: "", deskripsi: "" });
    setTampilForm(true);
  }

  function isiForm(k) {
    setIdEdit(k.id);
    setForm({ nama: k.nama, deskripsi: k.deskripsi || "" });
    setTampilForm(true);
  }

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setGagal(false);
    const isi = { nama: form.nama.trim(), deskripsi: form.deskripsi.trim() };
    try {
      if (idEdit) {
        await api(`/api/kategori/${idEdit}`, { method: "PUT", body: JSON.stringify(isi) });
      } else {
        await api("/api/kategori", { method: "POST", body: JSON.stringify(isi) });
      }
      setPesan("Kategori berhasil disimpan.");
      setTampilForm(false);
      muat();
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  async function hapus(id) {
    if (!confirm("Hapus kategori ini?")) return;
    try {
      await api(`/api/kategori/${id}`, { method: "DELETE" });
      setPesan("Kategori berhasil dihapus.");
      setGagal(false);
      muat();
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    }
  }

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Daftar Kategori</h2>
      <Pesan teks={pesan} gagal={gagal} />

      <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="px-3 py-2">Nama</th>
                <th className="px-3 py-2">Deskripsi</th>
                {sayaAdmin && <th className="px-3 py-2">Aksi</th>}
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
                      <td className="space-x-2 px-3 py-2">
                        <button onClick={() => isiForm(k)} className={tombolKecil}>
                          Ubah
                        </button>
                        <button onClick={() => hapus(k.id)} className={tombolHapus}>
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
      </div>

      {sayaAdmin && tampilForm && (
        <div className="mb-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <h3 className="mb-3 text-lg font-semibold">
            {idEdit ? "Ubah Kategori" : "Tambah Kategori"}
          </h3>
          <form onSubmit={simpan} className="space-y-4">
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
              <label htmlFor="deskripsi" className={labelCls}>
                Deskripsi
              </label>
              <input
                id="deskripsi"
                value={form.deskripsi}
                onChange={(e) => setForm({ ...form, deskripsi: e.target.value })}
                className={inputCls}
              />
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
          Tambah Kategori
        </button>
      )}
    </div>
  );
}
