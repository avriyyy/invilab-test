import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pesan, inputCls, labelCls, tombolHantu, tombolPrimer } from "../components/ui";

export default function KategoriForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [form, setForm] = useState({ nama: "", deskripsi: "" });
  const [memuat, setMemuat] = useState(edit);
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    if (!edit) return;
    api(`/api/kategori/${id}`)
      .then((data) => {
        setForm({ nama: data.data.nama, deskripsi: data.data.deskripsi || "" });
      })
      .catch((err) => setPesan(err.message))
      .finally(() => setMemuat(false));
  }, [edit, id]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setMenyimpan(true);
    const isi = { nama: form.nama.trim(), deskripsi: form.deskripsi.trim() };
    try {
      if (edit) {
        await api(`/api/kategori/${id}`, { method: "PUT", body: JSON.stringify(isi) });
      } else {
        await api("/api/kategori", { method: "POST", body: JSON.stringify(isi) });
      }
      navigate("/kategori", { state: { pesan: "Kategori berhasil disimpan." } });
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{edit ? "Ubah Kategori" : "Tambah Kategori"}</h2>
        <Link to="/kategori" className={tombolHantu}>
          Kembali ke daftar
        </Link>
      </div>
      <Pesan teks={pesan} gagal />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {memuat ? (
          <p className="py-6 text-center text-slate-500">Memuat...</p>
        ) : (
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
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate("/kategori")} className={tombolHantu}>
                Batal
              </button>
              <button type="submit" disabled={menyimpan} className={tombolPrimer}>
                {menyimpan ? "Menyimpan..." : "Simpan"}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
