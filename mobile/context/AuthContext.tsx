import React, { createContext, useContext, useEffect, useState } from 'react';
import { getToken, saveToken, clearToken } from '@/lib/auth';
import axios from 'axios';

type User = {
  id: string;
  email: string;
  first_name?: string;
  avatar?: string;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  loading: boolean;
  login: (token: string, user: User, isNew?: boolean) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const storedToken = await getToken();
      if (storedToken) {
        setToken(storedToken);
        // Optional: ดึง user profile จาก backend
        // const res = await axios.get('/api/me', { headers: { Authorization: `Bearer ${storedToken}` } });
        // setUser(res.data.user);
      }
      setLoading(false);
    })();
  }, []);

  const login = async (newToken: string, newUser: User, isNew = false) => {
    await saveToken(newToken);
    setToken(newToken);
    setUser(newUser);
    setIsNewUser(isNew);
  };

  const logout = async () => {
    await clearToken();
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, isNewUser, setIsNewUser, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext)!;
