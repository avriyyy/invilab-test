import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { Pesan, inputCls, labelCls, tombolPrimer } from "../components/ui";

export default function Login() {
  const { login, user } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [pesan, setPesan] = useState("");
  const [memuat, setMemuat] = useState(false);

  if (user) return <Navigate to="/barang" replace />;

  async function kirim(e) {
    e.preventDefault();
    setPesan("");
    setMemuat(true);
    try {
      await login(email.trim(), password);
      navigate("/barang", { replace: true });
    } catch (err) {
      setPesan(err.message);
    } finally {
      setMemuat(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h1 className="text-2xl font-bold">InviLab</h1>
        <p className="mt-1 text-sm text-slate-500">
          Inventaris Laboratorium. Masuk untuk lanjut.
        </p>
        <div className="mt-4">
          <Pesan teks={pesan} gagal />
        </div>
        <form onSubmit={kirim} className="space-y-4">
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
              Kata sandi
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputCls}
            />
          </div>
          <button type="submit" disabled={memuat} className={`${tombolPrimer} w-full`}>
            {memuat ? "Memproses..." : "Masuk"}
          </button>
        </form>
        <p className="mt-4 text-sm text-slate-600">
          Belum punya akun?{" "}
          <Link to="/register" className="text-blue-700 hover:underline">
            Daftar
          </Link>
        </p>
      </div>
    </div>
  );
}
