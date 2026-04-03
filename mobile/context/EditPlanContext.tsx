import React, { createContext, useContext, useMemo, useState } from "react";

type EditPlanDraftMap = Record<string, any>;

type EditPlanContextType = {
  drafts: EditPlanDraftMap;
  setDraft: (tripId: string, plan: any) => void;
  clearDraft: (tripId: string) => void;
  getDraft: (tripId: string) => any | null;
};

const EditPlanContext = createContext<EditPlanContextType | null>(null);

export function EditPlanProvider({ children }: { children: React.ReactNode }) {
  const [drafts, setDrafts] = useState<EditPlanDraftMap>({});

  const value = useMemo(
    () => ({
      drafts,
      setDraft: (tripId: string, plan: any) => {
        setDrafts((prev) => ({
          ...prev,
          [tripId]: plan,
        }));
      },
      clearDraft: (tripId: string) => {
        setDrafts((prev) => {
          const next = { ...prev };
          delete next[tripId];
          return next;
        });
      },
      getDraft: (tripId: string) => drafts[tripId] ?? null,
    }),
    [drafts]
  );

  return (
    <EditPlanContext.Provider value={value}>
      {children}
    </EditPlanContext.Provider>
  );
}

export function useEditPlanDraft() {
  const ctx = useContext(EditPlanContext);
  if (!ctx) {
    throw new Error("useEditPlanDraft must be used inside EditPlanProvider");
  }
  return ctx;
}
