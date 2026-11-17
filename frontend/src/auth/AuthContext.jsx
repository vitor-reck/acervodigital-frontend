import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { authApi } from '../api';
import { session } from '../api/client';

const AuthContext = createContext(null);

function readValidSession() {
  const stored = session.read();
  if (stored && stored.expiresAt > Date.now()) return stored;
  session.clear();
  return null;
}

export function AuthProvider({ children }) {
  const [current, setCurrent] = useState(readValidSession);

  useEffect(() => {
    const onExpired = () => setCurrent(null);
    window.addEventListener('acervo:logout', onExpired);
    return () => window.removeEventListener('acervo:logout', onExpired);
  }, []);

  const login = useCallback(async (email, password) => {
    const data = await authApi.login({ email, password });
    const value = { token: data.token, user: data.user, expiresAt: Date.now() + data.expiresIn * 1000 };
    session.write(value);
    setCurrent(value);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    session.clear();
    setCurrent(null);
  }, []);

  const value = useMemo(
    () => ({ user: current?.user ?? null, isLibrarian: current?.user.role === 'librarian', login, logout }),
    [current, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
