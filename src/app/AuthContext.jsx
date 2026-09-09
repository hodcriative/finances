import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getToken } from "../services/apiClient";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(Boolean(getToken()));

  useEffect(() => {
    if (!getToken()) return;
    authService.getCurrentUser().then(setUser).catch(() => setUser(null)).finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (credentials) => {
    const nextUser = await authService.login(credentials);
    setUser(nextUser);
  }, []);
  const register = useCallback(async (details) => {
    const nextUser = await authService.register(details);
    setUser(nextUser);
  }, []);
  const logout = useCallback(async () => {
    await authService.logout();
    setUser(null);
  }, []);

  return <AuthContext.Provider value={{ user, loading, login, register, logout }}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth precisa ser usado dentro de <AuthProvider>.");
  return context;
}
