import { useEffect, useRef, useState } from "react";
import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function IkonPengguna() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

function IkonKeluar() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-5 w-5"
      aria-hidden="true"
    >
      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
      <polyline points="16 17 21 12 16 7" />
      <line x1="21" y1="12" x2="9" y2="12" />
    </svg>
  );
}

export default function Layout() {
  const { user, logout } = useAuth();
  const [menuTerbuka, setMenuTerbuka] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!menuTerbuka) return;
    function tutup(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuTerbuka(false);
      }
    }
    function kunci(e) {
      if (e.key === "Escape") setMenuTerbuka(false);
    }
    document.addEventListener("mousedown", tutup);
    window.addEventListener("keydown", kunci);
    return () => {
      document.removeEventListener("mousedown", tutup);
      window.removeEventListener("keydown", kunci);
    };
  }, [menuTerbuka]);

  const dasar = "rounded-md px-3 py-2 text-sm text-blue-100 hover:bg-blue-900 hover:text-white";
  const tautan = ({ isActive }) => dasar + (isActive ? " bg-blue-900 text-white" : "");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-10 bg-[#0b3d5c] text-white shadow-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <NavLink to="/barang" className="mr-2 text-xl font-bold">
            InviLab
          </NavLink>
          <nav className="ml-auto flex flex-wrap items-center gap-1">
            <NavLink to="/barang" className={tautan}>
              Barang
            </NavLink>
            <NavLink to="/peminjaman" className={tautan}>
              Peminjaman
            </NavLink>
            <NavLink to="/kategori" className={tautan}>
              Kategori
            </NavLink>
          </nav>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuTerbuka((buka) => !buka)}
              title="Akun"
              aria-label="Menu akun"
              aria-expanded={menuTerbuka}
              className="flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-blue-100 hover:bg-blue-900 hover:text-white"
            >
              <IkonPengguna />
            </button>
            {menuTerbuka && user && (
              <div className="absolute right-0 top-full z-20 mt-2 w-56 rounded-lg border border-slate-200 bg-white p-4 text-slate-800 shadow-lg">
                <p className="font-semibold">{user.nama}</p>
                <p className="mt-0.5 truncate text-sm text-slate-500">{user.email}</p>
                <span
                  className={`mt-2 inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    user.role === "admin"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-slate-200 text-slate-700"
                  }`}
                >
                  {user.role === "admin" ? "Admin" : "Anggota"}
                </span>
                <button
                  onClick={() => {
                    setMenuTerbuka(false);
                    logout();
                  }}
                  className="mt-3 flex w-full cursor-pointer items-center justify-center gap-2 rounded-md bg-red-700 px-3 py-2 text-sm font-medium text-white hover:bg-red-800"
                >
                  <IkonKeluar />
                  Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
