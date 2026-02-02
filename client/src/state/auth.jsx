import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import api from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [booting, setBooting] = useState(true);

  const reqSeq = useRef(0);

  async function loadMe() {
    const mySeq = ++reqSeq.current;

    try {
      const token = localStorage.getItem("hl_token");
      if (!token) {
        if (mySeq === reqSeq.current) setUser(null);
        return null;
      }

      const res = await api.get("/auth/me");
      if (mySeq === reqSeq.current) setUser(res.data.user);
      return res.data.user;
    } catch {
      if (mySeq === reqSeq.current) {
        localStorage.removeItem("hl_token");
        setUser(null);
      }
      return null;
    }
  }

  useEffect(() => {
    let alive = true;

    (async () => {
      setBooting(true);
      await loadMe();
      if (alive) setBooting(false);
    })();

    return () => {
      alive = false;
      reqSeq.current++;
    };
  }, []);

  const value = useMemo(
    () => ({
      user,
      booting,
      setUser,

      async login(email, password) {
        const res = await api.post("/auth/login", { email, password });
        localStorage.setItem("hl_token", res.data.token);
        reqSeq.current++;
        setUser(res.data.user);
        return res.data.user;
      },

      async register(name, email, password) {
        const res = await api.post("/auth/register", { name, email, password });
        localStorage.setItem("hl_token", res.data.token);
        reqSeq.current++;
        setUser(res.data.user);
        return res.data.user;
      },

      async logout() {
        try {
          await api.post("/auth/logout");
        } catch {}
        localStorage.removeItem("hl_token");
        reqSeq.current++;
        setUser(null);
      },

      async refreshMe() {
        return await loadMe();
      },
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
