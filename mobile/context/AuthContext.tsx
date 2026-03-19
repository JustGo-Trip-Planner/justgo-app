import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { getToken, saveToken, clearToken } from "@/lib/auth";
import Constants from "expo-constants";
import axios from "axios";

type User = {
  id: string;
  email: string;
  first_name?: string;
  last_name?: string;
  avatar?: string;
  gender?: string;
  birth_date?: string;
  phone?: string;
  interests?: string[];
  activities?: string[];
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  loading: boolean;
  login: (token: string, user: User, isNew?: boolean) => Promise<void>;
  logout: () => Promise<void>;
  refreshMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const API_URL = Constants.expoConfig?.extra?.API_URL;

  const [token, setToken] = useState<string | null>(null);
  const [isNewUser, setIsNewUser] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // ตั้งค่า axios baseURL + interceptor
  useEffect(() => {
    if (!API_URL) return;
    axios.defaults.baseURL = API_URL;

    const reqId = axios.interceptors.request.use((config) => {
      if (token) {
        config.headers = config.headers ?? {};
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    const resId = axios.interceptors.response.use(
      (res) => res,
      async (err) => {
        // ถ้า token หมดอายุ → เคลียร์ auth
        if (err?.response?.status === 401) {
          await clearToken();
          setToken(null);
          setUser(null);
        }
        return Promise.reject(err);
      }
    );

    return () => {
      axios.interceptors.request.eject(reqId);
      axios.interceptors.response.eject(resId);
    };
  }, [API_URL, token]);

  const refreshMe = async () => {
    if (!token) return;
    try {
      const res = await axios.get<{ user: User }>("/api/auth/me");
      setUser((prev) => ({
        ...prev,
        ...res.data.user,
      }));
    } catch (err) {
      console.log("refreshMe failed:", err);
    }
  };

  // restore token + restore user
  useEffect(() => {
    (async () => {
      try {
        const storedToken = await getToken();
        if (storedToken) {
          setToken(storedToken);
          // ดึง profile ด้วย token
          try {
            const res = await axios.get<{ user: User }>(`${API_URL}/api/auth/me`, {
              headers: { Authorization: `Bearer ${storedToken}` },
            });
            setUser(res.data.user);
          } catch (e) {
            // token ใช้ไม่ได้
            await clearToken();
            setToken(null);
            setUser(null);
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  }, [API_URL]);

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

  const value = useMemo(
    () => ({ user, token, isNewUser, setIsNewUser, login, logout, loading, refreshMe }),
    [user, token, isNewUser, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};