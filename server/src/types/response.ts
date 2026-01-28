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
  category: string;
}

export interface Activity {
  time: string;
  place_name: string;
  category: string;
  rating: number;
  entry_fee?: {
    thai: number;
    foreigner: number;
  };
  open_time?: string;
  close_time?: string;
  activity?: string;
  lat?: number;
  lng?: number;
  image?: string;
}

export interface DayItinerary {
  date: string;
  hour?: string;
  activities: Activity[];
}

export interface ExpenseBreakdown {
  transportation: number;
  accommodation: number;
  food: number;
  others: number;
  total: number;
}

export interface Plan {
  trip_title: string;
  start_date: string;
  end_date: string;
  total_budget: number;
  total_places: number;
  recommended_hotels: Hotel[];
  daily_itinerary: DayItinerary[];
  daily_budget?: any[];
  total_expense_breakdown: ExpenseBreakdown;
  route_description?: Record<string, string>;
}
