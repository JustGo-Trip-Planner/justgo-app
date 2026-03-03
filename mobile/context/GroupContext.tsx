import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import axios from "axios";
import { useAuth } from "@/context/AuthContext";

export type Group = {
  _id: string;
  name: string;
  owner: string;
  members: Array<{
    userId: string;
    name?: string;
    avatar?: string;
    status: "pending" | "accepted";
  }>;
  createdAt: string;
};

type GroupContextType = {
  groups: Group[];
  loading: boolean;
  refreshGroups: () => Promise<void>;
};

const GroupContext = createContext<GroupContextType | null>(null);

export const GroupProvider = ({ children }: { children: React.ReactNode }) => {
  const { token, loading: authLoading } = useAuth();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(false);

  const refreshGroups = useCallback(async () => {
    if (!token) {
      setGroups([]);
      return;
    }
    try {
      setLoading(true);
      const res = await axios.get<Group[]>("/api/groups/me");
      setGroups(Array.isArray(res.data) ? res.data : []);
    } catch {
      setGroups([]);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (authLoading) return;
    refreshGroups();
  }, [authLoading, refreshGroups]);

  const value = useMemo(() => ({ groups, loading, refreshGroups }), [groups, loading]);

  return <GroupContext.Provider value={value}>{children}</GroupContext.Provider>;
};

export const useGroups = () => {
  const ctx = useContext(GroupContext);
  if (!ctx) throw new Error("useGroups must be used within GroupProvider");
  return ctx;
};