import { createContext, useContext, useState } from "react";
import { api, hapusSesi, penggunaSaatIni, simpanSesi } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(penggunaSaatIni);

  async function login(email, password) {
    const data = await api("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    simpanSesi(data.data.token, data.data.user);
    setUser(data.data.user);
  }

  async function register(nama, email, password) {
    await api("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ nama, email, password }),
    });
  }

  async function logout() {
    try {
      await api("/api/auth/logout", { method: "POST" });
    } catch {
      // Token sudah tidak valid pun tetap keluar.
    }
    hapusSesi();
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
