import { NavLink, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Layout() {
  const { user, logout } = useAuth();
  const dasar = "rounded-md px-3 py-2 text-sm text-blue-100 hover:bg-blue-900 hover:text-white";
  const tautan = ({ isActive }) => dasar + (isActive ? " bg-blue-900 text-white" : "");

  return (
    <div className="min-h-screen bg-slate-100 text-slate-800">
      <header className="bg-[#0b3d5c] text-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between px-4 py-3">
          <NavLink to="/barang" className="text-xl font-bold">
            InviLab
          </NavLink>
          <nav className="flex flex-wrap items-center gap-1">
            <NavLink to="/barang" className={tautan}>
              Barang
            </NavLink>
            <NavLink to="/peminjaman" className={tautan}>
              Peminjaman
            </NavLink>
            <NavLink to="/kategori" className={tautan}>
              Kategori
            </NavLink>
            <NavLink to="/profile" className={tautan}>
              Profil
            </NavLink>
            <button
              onClick={logout}
              className="ml-2 cursor-pointer rounded-md bg-white/10 px-3 py-2 text-sm hover:bg-white/20"
            >
              Keluar{user ? ` (${user.nama})` : ""}
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  );
}
