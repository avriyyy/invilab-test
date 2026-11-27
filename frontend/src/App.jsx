import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Barang from "./pages/Barang";
import BarangForm from "./pages/BarangForm";
import Peminjaman from "./pages/Peminjaman";
import PeminjamanForm from "./pages/PeminjamanForm";
import Kategori from "./pages/Kategori";
import KategoriForm from "./pages/KategoriForm";
import Profile from "./pages/Profile";

// Route yang dibungkus ini hanya bisa dibuka kalau sudah login.
function PerluLogin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

// Route yang dibungkus ini hanya bisa dibuka oleh admin.
function PerluAdmin({ children }) {
  const { user } = useAuth();
  if (user?.role !== "admin") return <Navigate to="/barang" replace />;
  return children;
}

export default function App() {
  const { user } = useAuth();
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        element={
          <PerluLogin>
            <Layout />
          </PerluLogin>
        }
      >
        <Route path="/barang" element={<Barang />} />
        <Route
          path="/barang/tambah"
          element={
            <PerluAdmin>
              <BarangForm />
            </PerluAdmin>
          }
        />
        <Route
          path="/barang/:id/ubah"
          element={
            <PerluAdmin>
              <BarangForm />
            </PerluAdmin>
          }
        />
        <Route path="/peminjaman" element={<Peminjaman />} />
        <Route path="/peminjaman/tambah" element={<PeminjamanForm />} />
        <Route
          path="/peminjaman/:id/ubah"
          element={
            <PerluAdmin>
              <PeminjamanForm />
            </PerluAdmin>
          }
        />
        <Route path="/kategori" element={<Kategori />} />
        <Route
          path="/kategori/tambah"
          element={
            <PerluAdmin>
              <KategoriForm />
            </PerluAdmin>
          }
        />
        <Route
          path="/kategori/:id/ubah"
          element={
            <PerluAdmin>
              <KategoriForm />
            </PerluAdmin>
          }
        />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/" element={<Navigate to={user ? "/barang" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/barang" : "/login"} replace />} />
    </Routes>
  );
}
