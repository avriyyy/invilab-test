// Komponen kecil yang dipakai ulang di halaman-halaman.

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
