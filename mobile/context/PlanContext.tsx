import React, { createContext, useContext, useState, ReactNode } from "react";

export type PlanData = {
  province: string; // id
  provinceName: string; // ชื่อจังหวัด
  image?: string; // cover image จังหวัด
  startDate: string;
  endDate: string;

  groupType: string; // "คนเดียว" | "คู่รัก" | "ครอบครัว" | "เพื่อน"
  interests: string[];
  activities: string[];

  budgetType: string;
  budgetAmount: number;

  planName?: string; // ชื่อแผน
  numPlans?: number; // จำนวนแผนที่ต้องการสร้าง

  mode?: string;
  friendCount?: number;
  family?: {
    adult: number;
    kid: number;
    elderly: number;
  };
};

// LLM (preview)
export type GeneratedPlan = {
  id: string;
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  total_places: number;
  
  recommended_hotels?: Array<{
    name: string;
    stars?: number;
    image?: string;
  }>;
  previewImage?: string;

  // optional
  daily_itinerary?: any[];
  daily_budget?: any[];
  total_expense_breakdown?: any;
  route_description?: Record<string, string>;
};

const defaultPlan: PlanData = {
  province: "",
  provinceName: "",
  image: "",
  startDate: "",
  endDate: "",
  groupType: "",
  interests: [],
  activities: [],
  budgetType: "",
  budgetAmount: 0,
  planName: "",
  numPlans: 1,
};

type PlanContextType = {
  plan: PlanData;
  setPlan: React.Dispatch<React.SetStateAction<PlanData>>;
  plans: GeneratedPlan[];
  setPlans: React.Dispatch<React.SetStateAction<GeneratedPlan[]>>;
};

const PlanContext = createContext<PlanContextType>({
  plan: defaultPlan,
  setPlan: () => {},
  plans: [],
  setPlans: () => {},
});

export const PlanProvider = ({ children }: { children: ReactNode }) => {
  const [plan, setPlan] = useState<PlanData>(defaultPlan);
  const [plans, setPlans] = useState<GeneratedPlan[]>([]);

  return (
    <PlanContext.Provider value={{ plan, setPlan, plans, setPlans }}>
      {children}
    </PlanContext.Provider>
  );
};

export const usePlan = () => {
  const ctx = useContext(PlanContext);
  
  if (!ctx) throw new Error("usePlan must be used within PlanProvider");
  return ctx;
};

export const useSelectedPlan = (id?: string): GeneratedPlan | undefined => {
  const { plans } = usePlan();
  if (!id) return undefined;

  const index = parseInt(id);
  if (isNaN(index)) return undefined;

  return plans[index];
};
