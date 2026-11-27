import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Pesan, inputCls, labelCls, tombolPrimer } from "../components/ui";

export default function Register() {
  const { register, user } = useAuth();
  const navigate = useNavigate();
  const [nama, setNama] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [gagal, setGagal] = useState(false);
  const [memuat, setMemuat] = useState(false);

  if (user) return <Navigate to="/barang" replace />;

  async function kirim(e) {
    e.preventDefault();
    setPesan("");
    setGagal(false);
    setMemuat(true);
    try {
      await register(nama.trim(), email.trim(), password);
      setPesan("Akun berhasil dibuat, silakan masuk.");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setPesan(err.message);
      setGagal(true);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">Daftar akun</h1>
        <p className="mt-1 text-sm text-slate-500">
          Akun baru otomatis berperan sebagai anggota.
        </p>
        <div className="mt-4">
          <Pesan teks={pesan} gagal={gagal} />
        </div>
        <form onSubmit={kirim} className="space-y-4">
          <div>
            <label htmlFor="nama" className={labelCls}>
              Nama
            </label>
            <input
              id="nama"
              type="text"
              required
              minLength={3}
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="email" className={labelCls}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputCls}
            />
          </div>
          <div>
            <label htmlFor="password" className={labelCls}>
              Kata sandi (minimal 6 karakter)
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={memuat} className={`${tombolPrimer} w-full`}>
            {memuat ? "Memproses..." : "Daftar"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Sudah punya akun?{" "}
          <Link to="/login" className="text-blue-700 hover:underline">
            Masuk
          </Link>
        </p>
      </div>
    </div>
  );
}
