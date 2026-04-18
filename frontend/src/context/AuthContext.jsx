import { createContext, useContext, useEffect, useMemo, useState } from "react";

const AuthContext = createContext(null);

const safeParse = (rawValue, fallback) => {
  try {
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch (error) {
    return fallback;
  }
};

export function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem("cx_token") || "");
  const [user, setUser] = useState(() => safeParse(localStorage.getItem("cx_user"), null));

  useEffect(() => {
    if (token && !user) {
      localStorage.removeItem("cx_token");
      setToken("");
    }
  }, [token, user]);

  const login = (authToken, authUser) => {
    localStorage.setItem("cx_token", authToken);
    localStorage.setItem("cx_user", JSON.stringify(authUser));
    setToken(authToken);
    setUser(authUser);
  };

  const updateUser = (nextUser) => {
    localStorage.setItem("cx_user", JSON.stringify(nextUser));
    setUser(nextUser);
  };

  const logout = () => {
    localStorage.removeItem("cx_token");
    localStorage.removeItem("cx_user");
    setToken("");
    setUser(null);
  };

  const value = useMemo(
    () => ({ token, user, login, logout, updateUser, isAuthenticated: Boolean(token && user) }),
    [token, user]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
