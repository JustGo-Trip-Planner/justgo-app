import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";
import { useGroups } from "./GroupContext";

type PopUser = { _id: string; first_name?: string; avatar?: string };
type PopGroup = { _id: string; name?: string };

export type AppNotification = {
  _id: string;
  type: "group_invite";
  status: "unread" | "read" | "accepted" | "declined";
  createdAt: string;

  fromUserId?: PopUser | string;
  groupId?: PopGroup | string;
};

type NotificationContextType = {
  items: AppNotification[];
  unreadCount: number;
  loading: boolean;

  refresh: () => Promise<AppNotification[]>;

  respondInvite: (groupId: string, action: "accept" | "decline") => Promise<void>;
  markRead: (id: string) => Promise<void>;
};

const NotificationContext = createContext<NotificationContextType | null>(null);

export const NotificationsProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, loading: authLoading } = useAuth();
  const { refreshGroups } = useGroups();

  const [items, setItems] = useState<AppNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = async (): Promise<AppNotification[]> => {
    if (!token) {
      setItems([]);
      return [];
    }
    try {
      setLoading(true);
      const res = await axios.get<AppNotification[]>("/api/notifications");
      const data = Array.isArray(res.data) ? res.data : [];
      setItems(data);
      return data;
    } catch (e) {
      setItems([]);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id: string) => {
    try {
      await axios.put(`/api/notifications/${id}/read`);
      setItems((prev) =>
        prev.map((n) => (n._id === id && n.status === "unread" ? { ...n, status: "read" } : n))
      );
    } catch {}
  };

  const respondInvite = async (groupId: string, action: "accept" | "decline") => {
    await axios.post(`/api/groups/${groupId}/respond`, { action });
    await refresh();
    await refreshGroups();
  };

  const unreadCount = useMemo(
    () => items.filter((n) => n.type === "group_invite" && n.status === "unread").length,
    [items]
  );

  useEffect(() => {
    if (authLoading) return;
    refresh();
  }, [authLoading, token]);

  useEffect(() => {
    if (!token) return;

    if (pollingRef.current) clearInterval(pollingRef.current);

    pollingRef.current = setInterval(() => {
      refresh();
    }, 20000);

    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
      pollingRef.current = null;
    };
  }, [token]);

  const value = useMemo(
    () => ({ items, unreadCount, loading, refresh, respondInvite, markRead }),
    [items, unreadCount, loading]
  );

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>;
};

export const useNotifications = () => {
  const ctx = useContext(NotificationContext);
  if (!ctx) throw new Error("useNotifications must be used within NotificationsProvider");
  return ctx;
};