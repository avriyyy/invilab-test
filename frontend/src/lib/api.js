// Klien API InviLab: fetch + token JWT + penanganan 401.
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

export function ambilToken() {
  return localStorage.getItem("token");
}

export function simpanSesi(token, user) {
  localStorage.setItem("token", token);
  localStorage.setItem("user", JSON.stringify(user));
}

export function hapusSesi() {
  localStorage.removeItem("token");
  localStorage.removeItem("user");
}

export function penggunaSaatIni() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

// Kalau server menjawab 401, sesi dianggap habis: token dihapus dan
// pengguna dilempar ke halaman login.
export async function api(path, options = {}) {
  const token = ambilToken();
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers.Authorization = "Bearer " + token;

  const res = await fetch(API_URL + path, { ...options, headers });
  if (res.status === 401) {
    hapusSesi();
    if (!window.location.pathname.startsWith("/login")) {
      window.location.href = "/login";
    }
    throw new Error("Sesi habis, silakan login lagi.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Terjadi kesalahan.");
  return data;
}
