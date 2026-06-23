import { createContext, useContext, useEffect, useState } from 'react';
import { api } from './api';
import { resetCache } from './data/db';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('concorcio_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('concorcio_token');
    if (!token) {
      setLoading(false);
      return;
    }
    // Verify token is still valid
    api.get('/auth/me').then(({ user }) => {
      setUser(user);
      localStorage.setItem('concorcio_user', JSON.stringify(user));
    }).catch(() => {
      localStorage.removeItem('concorcio_token');
      localStorage.removeItem('concorcio_user');
      setUser(null);
    }).finally(() => setLoading(false));
  }, []);

  const signUp = async (email, password) => {
    const { token, user } = await api.post('/auth/register', { email, password });
    localStorage.setItem('concorcio_token', token);
    localStorage.setItem('concorcio_user', JSON.stringify(user));
    setUser(user);
  };

  const signIn = async (email, password) => {
    const { token, user } = await api.post('/auth/login', { email, password });
    localStorage.setItem('concorcio_token', token);
    localStorage.setItem('concorcio_user', JSON.stringify(user));
    setUser(user);
  };

  const signOut = async () => {
    localStorage.removeItem('concorcio_token');
    localStorage.removeItem('concorcio_user');
    resetCache();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signUp, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
