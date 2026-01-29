// types/response.ts
export interface EntryFee {
  thai?: number;
  foreigner?: number;
}

export interface Activity {
  time: string;
  place_name: string;
  category: string;
  rating?: number;
  entry_fee?: EntryFee;
  open_time?: string;
  close_time?: string;
  activity?: string;
  lat?: number;
  lng?: number;
  image?: string;
  hour?: string;
}

export interface DailyItinerary {
  date: string;
  activities: Activity[];
}

export interface DailyBudget {
  date: string;
  transportation: number;
  accommodation: number;
  food: number;
  others: number;
  total: number;
}

export interface Hotel {
  name: string;
  type: string;
  stars: number;
  price_per_night: number;
  rating: number;
  address: string;
  lat: number;
  lng: number;
  image: string;
  category?: string;
}

export interface TotalExpense {
  transportation: number;
  accommodation: number;
  food: number;
  others: number;
  total: number;
}

export interface Plan {
  _id?: string;
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  total_places: number;
  recommended_hotels?: Hotel[];
  daily_itinerary?: DailyItinerary[];
  daily_budget?: DailyBudget[];
  total_expense_breakdown?: TotalExpense;
  route_description?: Record<string, string>;
  previewImage?: string;
  province?: string;
  provinceName?: string;
  createdAt?: string;
}
