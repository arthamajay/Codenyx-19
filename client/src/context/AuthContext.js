import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]     = useState(null);
  const [token, setToken]   = useState(null);
  const [loading, setLoading] = useState(true); // true until session restored

  useEffect(() => {
    const saved = localStorage.getItem('mb_session');
    if (saved) {
      try {
        const { user, token } = JSON.parse(saved);
        setUser(user);
        setToken(token);
      } catch {
        localStorage.removeItem('mb_session');
      }
    }
    setLoading(false);
  }, []);

  const login = (userData, jwt) => {
    setUser(userData);
    setToken(jwt);
    localStorage.setItem('mb_session', JSON.stringify({ user: userData, token: jwt }));
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('mb_session');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
