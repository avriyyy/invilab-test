import { useEffect, useState } from "react";
import { api } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import { Badge, Pesan, tombolHapus } from "../components/ui";

export default function Profile() {
  const { logout } = useAuth();
  const [profil, setProfil] = useState(null);
  const [pesan, setPesan] = useState("");

  useEffect(() => {
    api("/api/auth/profile")
      .then((data) => setProfil(data.data))
      .catch((err) => setPesan(err.message));
  }, []);

  return (
    <div>
      <h2 className="mb-4 text-2xl font-bold">Profil Saya</h2>
      <Pesan teks={pesan} gagal />
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        {profil ? (
          <>
            <p className="py-1">
              <strong>Nama:</strong> {profil.nama}
            </p>
            <p className="py-1">
              <strong>Email:</strong> {profil.email}
            </p>
            <p className="py-1">
              <strong>Role:</strong>{" "}
              <Badge warna={profil.role === "admin" ? "biru" : "abu"}>{profil.role}</Badge>
            </p>
          </>
        ) : (
          <p className="text-slate-500">Memuat...</p>
        )}
        <div className="mt-6">
          <button onClick={logout} className={tombolHapus}>
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
