import mongoose, { Schema, Document } from "mongoose";
import { Plan } from "../types/response";

export interface PlanDocument extends Plan, Document {
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema(
  {
    time: String,
    place_name: String,
    category: String,
    rating: Number,
    image: String,
    open_time: String,
    close_time: String,
    entry_fee: {
      thai: Number,
      foreigner: Number,
    },
  },
  { _id: false }
);

const DayItinerarySchema = new Schema(
  {
    date: String,
    hour: String,
    activities: [ActivitySchema],
  },
  { _id: false }
);

const ExpenseBreakdownSchema = new Schema(
  {
    transportation: Number,
    accommodation: Number,
    food: Number,
    others: Number,
    total: Number,
  },
  { _id: false }
);

const PlanSchema = new Schema(
  {
    trip_title: String,
    start_date: String,
    end_date: String,
    total_budget: Number,
    total_places: Number,
    previewImage: String,
    daily_itinerary: [DayItinerarySchema],
    total_expense_breakdown: ExpenseBreakdownSchema,
    route_description: { type: Map, of: String },
    daily_budget: Schema.Types.Mixed,
  },
  {
    timestamps: true,
  }
);

export const PlanModel = mongoose.model<PlanDocument>("Plan", PlanSchema);
