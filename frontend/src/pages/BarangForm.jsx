import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pesan, inputCls, labelCls, tombolHantu, tombolPrimer } from "../components/ui";

const formAwal = { kode_barang: "", nama: "", kategori_id: "", jumlah: 1, kondisi: "Baik", lokasi: "" };

export default function BarangForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [kategori, setKategori] = useState([]);
  const [form, setForm] = useState(formAwal);
  const [memuat, setMemuat] = useState(edit);
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    api("/api/kategori")
      .then((data) => setKategori(data.data || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!edit) return;
    api(`/api/barang/${id}`)
      .then((data) => {
        const b = data.data;
        setForm({
          kode_barang: b.kode_barang,
          nama: b.nama,
          kategori_id: String(b.kategori_id),
          jumlah: b.jumlah,
          kondisi: b.kondisi,
          lokasi: b.lokasi || "",
        });
      })
      .catch((err) => setPesan(err.message))
      .finally(() => setMemuat(false));
  }, [edit, id]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setMenyimpan(true);
    const isi = {
      kode_barang: form.kode_barang.trim(),
      nama: form.nama.trim(),
      kategori_id: parseInt(form.kategori_id, 10),
      jumlah: parseInt(form.jumlah, 10),
      kondisi: form.kondisi,
      lokasi: form.lokasi.trim(),
    };
    try {
      if (edit) {
        await api(`/api/barang/${id}`, { method: "PUT", body: JSON.stringify(isi) });
      } else {
        await api("/api/barang", { method: "POST", body: JSON.stringify(isi) });
      }
      navigate("/barang", { state: { pesan: "Barang berhasil disimpan." } });
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{edit ? "Ubah Barang" : "Tambah Barang"}</h2>
        <Link to="/barang" className={tombolHantu}>
          Kembali ke daftar
        </Link>
      </div>
      <Pesan teks={pesan} gagal />

      <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-6">
        {memuat ? (
          <p className="py-6 text-center text-slate-500">Memuat...</p>
        ) : (
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
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate("/barang")} className={tombolHantu}>
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
