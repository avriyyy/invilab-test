// Pembungkus fetch untuk memanggil API InviLab.
// Token JWT disimpan di localStorage, dikirim sebagai Bearer.
// Kalau server menjawab 401, pengguna dilempar ke halaman login.
async function api(path, options = {}) {
  const token = localStorage.getItem("token");
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  if (token) headers["Authorization"] = "Bearer " + token;

  const res = await fetch(API_BASE_URL + path, { ...options, headers });
  if (res.status === 401) {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    if (!location.pathname.endsWith("login.html")) location.href = "login.html";
    throw new Error("Sesi habis, silakan login lagi.");
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.message || "Terjadi kesalahan.");
  return data;
}

function userSaatIni() {
  try {
    return JSON.parse(localStorage.getItem("user") || "null");
  } catch {
    return null;
  }
}

function wajibLogin() {
  if (!localStorage.getItem("token")) location.href = "login.html";
}

function tampilPesan(el, teks, ok = true) {
  if (!el) return;
  el.textContent = teks;
  el.className = "pesan " + (ok ? "sukses" : "gagal");
}

async function logout() {
  try {
    await api("/api/auth/logout", { method: "POST" });
  } catch {}
  localStorage.removeItem("token");
  localStorage.removeItem("user");
  location.href = "login.html";
}
