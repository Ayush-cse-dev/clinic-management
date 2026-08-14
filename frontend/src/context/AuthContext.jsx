import { createContext, useCallback, useEffect, useState } from "react";
import api, { getErrorMessage } from "../api/client";

// eslint-disable-next-line react-refresh/only-export-components -- context and its provider are intentionally colocated
export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem("vela_user");
    const token = localStorage.getItem("vela_token");
    if (storedUser && token) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time session hydration from localStorage on mount
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("vela_user");
        localStorage.removeItem("vela_token");
      }
    }
    setLoading(false);
  }, []);

  const persistSession = useCallback((token, userData) => {
    localStorage.setItem("vela_token", token);
    localStorage.setItem("vela_user", JSON.stringify(userData));
    setUser(userData);
  }, []);

  const login = useCallback(
    async (email, password) => {
      try {
        const res = await api.post("/auth/login", { email, password });
        persistSession(res.data.access_token, res.data.user);
        return { success: true };
      } catch (err) {
        return { success: false, message: getErrorMessage(err, "Invalid email or password.") };
      }
    },
    [persistSession]
  );

  const register = useCallback(
    async (fullName, email, password, role) => {
      try {
        const res = await api.post("/auth/register", {
          full_name: fullName,
          email,
          password,
          role,
        });
        persistSession(res.data.access_token, res.data.user);
        return { success: true };
      } catch (err) {
        return { success: false, message: getErrorMessage(err, "Could not create account.") };
      }
    },
    [persistSession]
  );

  const logout = useCallback(() => {
    localStorage.removeItem("vela_token");
    localStorage.removeItem("vela_user");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}
