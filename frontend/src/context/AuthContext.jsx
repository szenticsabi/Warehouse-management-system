import { createContext, useState, useContext } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  // Liad user from localStorage
  const [user, setUser] = useState(() => {
    try {
      const raw = localStorage.getItem("pos-user");
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      // Minimal validation
      if (parsed && typeof parsed.role === "string") return parsed;
      localStorage.removeItem("pos-user");
      return null;
    } catch {
      localStorage.removeItem("pos-user");
      return null;
    }
  });

  // Load token from localStorage
  const [token, setToken] = useState(() => localStorage.getItem("pos-token") || null);

  // Log in, persist user and token in state + localStorage
  const login = (userData, jwtToken) => {
    setUser(userData);
    setToken(jwtToken || null);
    localStorage.setItem("pos-user", JSON.stringify(userData));
    if (jwtToken) localStorage.setItem("pos-token", jwtToken);
  };

  // Log out, cleare state and localStorage
  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pos-user");
    localStorage.removeItem("pos-token");
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// Hook to read values from AuthContext
export const useAuth = () => useContext(AuthContext);
export default AuthProvider;
