import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";
import { Pesan, inputCls, labelCls, tombolHantu, tombolPrimer } from "../components/ui";

function tanggal(iso) {
  return iso ? iso.slice(0, 10) : "";
}

const formAwal = {
  barang_id: "",
  nama_peminjam: "",
  nim: "",
  tanggal_pinjam: "",
  tanggal_kembali: "",
  status: "Dipinjam",
};

export default function PeminjamanForm() {
  const { id } = useParams();
  const edit = Boolean(id);
  const navigate = useNavigate();
  const [barang, setBarang] = useState([]);
  const [form, setForm] = useState(formAwal);
  const [memuat, setMemuat] = useState(edit);
  const [pesan, setPesan] = useState("");
  const [menyimpan, setMenyimpan] = useState(false);

  useEffect(() => {
    api("/api/barang?page=1&limit=100")
      .then((data) => setBarang(data.data.items || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!edit) return;
    api(`/api/peminjaman/${id}`)
      .then((data) => {
        const p = data.data;
        setForm({
          barang_id: String(p.barang_id),
          nama_peminjam: p.nama_peminjam,
          nim: p.nim,
          tanggal_pinjam: tanggal(p.tanggal_pinjam),
          tanggal_kembali: tanggal(p.tanggal_kembali),
          status: p.status,
        });
      })
      .catch((err) => setPesan(err.message))
      .finally(() => setMemuat(false));
  }, [edit, id]);

  async function simpan(e) {
    e.preventDefault();
    setPesan("");
    setMenyimpan(true);
    try {
      if (edit) {
        const isi = {
          barang_id: parseInt(form.barang_id, 10),
          nama_peminjam: form.nama_peminjam.trim(),
          nim: form.nim.trim(),
          tanggal_pinjam: form.tanggal_pinjam,
          tanggal_kembali: form.tanggal_kembali || null,
          status: form.status,
        };
        await api(`/api/peminjaman/${id}`, { method: "PUT", body: JSON.stringify(isi) });
        navigate("/peminjaman", { state: { pesan: "Peminjaman berhasil disimpan." } });
      } else {
        const isi = {
          barang_id: parseInt(form.barang_id, 10),
          nama_peminjam: form.nama_peminjam.trim(),
          nim: form.nim.trim(),
          tanggal_pinjam: form.tanggal_pinjam,
        };
        await api("/api/peminjaman", { method: "POST", body: JSON.stringify(isi) });
        navigate("/peminjaman", { state: { pesan: "Peminjaman berhasil dibuat." } });
      }
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMenyimpan(false);
    }
  }

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-2xl font-bold">{edit ? "Ubah Peminjaman" : "Pinjam Barang"}</h2>
        <Link to="/peminjaman" className={tombolHantu}>
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
              {edit && (
                <>
                  <div>
                    <label htmlFor="tanggal-kembali" className={labelCls}>
                      Tanggal kembali
                    </label>
                    <input
                      id="tanggal-kembali"
                      type="date"
                      value={form.tanggal_kembali}
                      onChange={(e) => setForm({ ...form, tanggal_kembali: e.target.value })}
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="status" className={labelCls}>
                      Status
                    </label>
                    <select
                      id="status"
                      value={form.status}
                      onChange={(e) => setForm({ ...form, status: e.target.value })}
                      className={inputCls}
                    >
                      <option>Dipinjam</option>
                      <option>Dikembalikan</option>
                    </select>
                  </div>
                </>
              )}
            </div>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => navigate("/peminjaman")} className={tombolHantu}>
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
