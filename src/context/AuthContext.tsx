import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';

export type AuthUser = {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
};

type RegisterPayload = {
  email: string;
  firstName: string;
  lastName: string;
  password: string;
};

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
  register: (payload: RegisterPayload) => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

async function parseJson(response: Response) {
  try {
    return await response.json();
  } catch (err) {
    return null;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/login', { credentials: 'include' });
      if (!res.ok) {
        setUser(null);
        return;
      }
      const json = await parseJson(res);
      setUser(json as AuthUser);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    try {
      const res = await fetch('/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password })
      });
      const json = await parseJson(res);
      if (!res.ok) {
        const message = (json as any)?.error ?? 'Misslyckad inloggning';
        throw new Error(message);
      }
      setUser(json as AuthUser);
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/login', {
        method: 'DELETE',
        credentials: 'include'
      });
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  const register = async (payload: RegisterPayload) => {
    setLoading(true);
    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(payload)
      });
      const json = await parseJson(res);
      if (!res.ok) {
        const message = (json as any)?.error ?? 'Misslyckad registrering';
        throw new Error(message);
      }
      await login(payload.email, payload.password);
    } catch (err) {
      setLoading(false);
      throw err;
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, refresh, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return context;
}
