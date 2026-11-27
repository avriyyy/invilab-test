import { Navigate, Route, Routes } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import Layout from "./components/Layout";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Barang from "./pages/Barang";
import Peminjaman from "./pages/Peminjaman";
import Kategori from "./pages/Kategori";
import Profile from "./pages/Profile";

// Route yang dibungkus ini hanya bisa dibuka kalau sudah login.
function PerluLogin({ children }) {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
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
        <Route path="/peminjaman" element={<Peminjaman />} />
        <Route path="/kategori" element={<Kategori />} />
        <Route path="/profile" element={<Profile />} />
      </Route>
      <Route path="/" element={<Navigate to={user ? "/barang" : "/login"} replace />} />
      <Route path="*" element={<Navigate to={user ? "/barang" : "/login"} replace />} />
    </Routes>
  );
}
