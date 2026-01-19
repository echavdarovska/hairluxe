import  { createContext, useContext, useEffect, useMemo, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  async function loadMe() {
    try {
      const token = localStorage.getItem("hl_token");
      if (!token) {
        setUser(null);
        return;
      }
      const res = await api.get("/auth/me");
      setUser(res.data.user);
    } catch {
      localStorage.removeItem("hl_token");
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      setBooting(true);
      await loadMe();
      setBooting(false);
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      setUser,
      async login(email, password) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("hl_token", res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      async register(name, email, password) {
        const res = await api.post("/auth/register", { name, email, password });
        localStorage.setItem("hl_token", res.data.token);
        setUser(res.data.user);
        return res.data.user;
      },
      async logout() {
        try { await api.post("/auth/logout"); } catch {}
        localStorage.removeItem("hl_token");
        setUser(null);
      },
      async refreshMe() {
        await loadMe();
      }
    }),
    [user, booting]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
