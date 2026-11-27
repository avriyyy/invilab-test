// Komponen kecil yang dipakai ulang di halaman-halaman.
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

export function Pesan({ teks, gagal }) {
  if (!teks) return null;
  return (
    <div
      className={`mb-4 rounded-md px-4 py-3 text-sm ${
        gagal ? "bg-red-100 text-red-800" : "bg-green-100 text-green-800"
      }`}
    >
      {teks}
    </div>
  );
}

export function Badge({ children, warna }) {
  const peta = {
    hijau: "bg-green-100 text-green-800",
    kuning: "bg-yellow-100 text-yellow-800",
    merah: "bg-red-100 text-red-800",
    biru: "bg-blue-100 text-blue-800",
    abu: "bg-slate-200 text-slate-700",
  };
  return (
    <span
      className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
        peta[warna] || peta.abu
      }`}
    >
      {children}
    </span>
  );
}

export const inputCls =
  "w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-blue-600 focus:outline-none";

export const labelCls = "mb-1 block text-sm font-medium";

export const tombolPrimer =
  "cursor-pointer rounded-md bg-blue-700 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800 disabled:opacity-60";

export const tombolHapus =
  "cursor-pointer rounded-md bg-red-700 px-3 py-1 text-xs font-medium text-white hover:bg-red-800";

export const tombolKecil =
  "cursor-pointer rounded-md bg-blue-700 px-3 py-1 text-xs font-medium text-white hover:bg-blue-800";

export const tombolHantu =
  "cursor-pointer rounded-md bg-slate-200 px-4 py-2 text-sm text-slate-800 hover:bg-slate-300";

// Ambil pesan sukses dari halaman form (location state), lalu bersihkan
// state-nya supaya pesan tidak muncul lagi saat halaman di-refresh.
export function usePesanState() {
  const location = useLocation();
  const navigate = useNavigate();
  const [pesan, setPesan] = useState(location.state?.pesan || "");
  const [gagal, setGagal] = useState(false);
  useEffect(() => {
    if (location.state?.pesan) {
      navigate(location.pathname, { replace: true, state: {} });
    }
    // Hanya sekali saat halaman dibuka.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return { pesan, setPesan, gagal, setGagal };
}

function daftarNomorHalaman(halaman, totalHalaman) {
  if (totalHalaman <= 7) {
    return Array.from({ length: totalHalaman }, (_, i) => i + 1);
  }
  const awal = Math.max(2, halaman - 1);
  const akhir = Math.min(totalHalaman - 1, halaman + 1);
  const daftar = [1];
  if (awal > 2) daftar.push("…");
  for (let i = awal; i <= akhir; i++) daftar.push(i);
  if (akhir < totalHalaman - 1) daftar.push("…");
  daftar.push(totalHalaman);
  return daftar;
}

// Pagination standar: info jumlah data di kiri, kontrol halaman di kanan.
export function Pagination({ halaman, totalHalaman, total, batas = 10, satuan, onPindah }) {
  const awal = total === 0 ? 0 : (halaman - 1) * batas + 1;
  const akhir = Math.min(halaman * batas, total);
  const tombolPindah =
    "cursor-pointer rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50";
  const tombolNomor =
    "min-w-9 cursor-pointer rounded-md border px-2 py-1.5 text-sm";

  return (
    <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
      <p className="text-sm text-slate-600">
        Menampilkan {awal}-{akhir} dari {total} {satuan}
      </p>
      <nav className="flex items-center gap-1" aria-label="Navigasi halaman">
        <button
          onClick={() => onPindah(halaman - 1)}
          disabled={halaman <= 1}
          className={tombolPindah}
        >
          Sebelumnya
        </button>
        {daftarNomorHalaman(halaman, totalHalaman).map((nomor, i) =>
          nomor === "…" ? (
            <span key={`lompati-${i}`} className="px-1 text-sm text-slate-500">
              …
            </span>
          ) : (
            <button
              key={nomor}
              onClick={() => onPindah(nomor)}
              aria-current={nomor === halaman ? "page" : undefined}
              className={`${tombolNomor} ${
                nomor === halaman
                  ? "border-blue-700 bg-blue-700 font-medium text-white"
                  : "border-slate-300 bg-white text-slate-700 hover:bg-slate-100"
              }`}
            >
              {nomor}
            </button>
          )
        )}
        <button
          onClick={() => onPindah(halaman + 1)}
          disabled={halaman >= totalHalaman}
          className={tombolPindah}
        >
          Berikutnya
        </button>
      </nav>
    </div>
  );
}
