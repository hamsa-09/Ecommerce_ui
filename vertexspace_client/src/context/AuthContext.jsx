import { createContext, useState } from "react";

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem("authUser");
    if (!storedUser) return null;

    try {
      return JSON.parse(storedUser);
    } catch {
      localStorage.removeItem("authUser");
      return null;
    }
  });

  const loginUser = (data) => {
    localStorage.setItem("authUser", JSON.stringify(data));
    localStorage.setItem("token", data.token);
    setUser(data);
  };

  const logoutUser = () => {
    localStorage.removeItem("authUser");
    localStorage.removeItem("token");
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loginUser, logoutUser }}>
      {children}
    </AuthContext.Provider>
  );
};
