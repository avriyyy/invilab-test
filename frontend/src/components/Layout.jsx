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
  const dasar = "rounded-md px-3 py-2 text-sm text-blue-100 hover:bg-blue-900 hover:text-white";
  const tautan = ({ isActive }) => dasar + (isActive ? " bg-blue-900 text-white" : "");
  const tombolIkon =
    "flex h-9 w-9 cursor-pointer items-center justify-center rounded-md text-blue-100 hover:bg-blue-900 hover:text-white";
  const tautanIkon = ({ isActive }) =>
    tombolIkon + (isActive ? " bg-blue-900 text-white" : "");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="sticky top-0 z-10 bg-[#0b3d5c] text-white shadow-md">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-2 px-4 py-3">
          <NavLink to="/barang" className="mr-2 text-xl font-bold">
            InviLab
          </NavLink>
          <nav className="flex flex-1 flex-wrap items-center gap-1">
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
          <div className="flex items-center gap-1">
            {user && (
              <span
                className={`mr-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ${
                  user.role === "admin"
                    ? "bg-blue-500/30 text-blue-100 ring-blue-300/50"
                    : "bg-white/10 text-blue-100 ring-white/25"
                }`}
              >
                {user.role === "admin" ? "Admin" : "Anggota"}
              </span>
            )}
            <NavLink to="/profile" title="Profil" aria-label="Profil" className={tautanIkon}>
              <IkonPengguna />
            </NavLink>
            <button
              onClick={logout}
              title="Keluar"
              aria-label="Keluar"
              className={tombolIkon}
            >
              <IkonKeluar />
            </button>
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
