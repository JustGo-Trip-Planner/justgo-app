import mongoose from "mongoose";

const EntryFeeSchema = new mongoose.Schema({
  thai: Number,
  foreigner: Number,
}, { _id: false });

const ActivitySchema = new mongoose.Schema({
  time: String,
  place_name: String,
  category: String,
  rating: Number,
  entry_fee: EntryFeeSchema,
  open_time: String,
  close_time: String,
  activity: String,
  lat: Number,
  lng: Number,
  image: String,
  hour: String,
}, { _id: false });

const DailyItinerarySchema = new mongoose.Schema({
  date: String,
  activities: [ActivitySchema],
}, { _id: false });

const DailyBudgetSchema = new mongoose.Schema({
  date: String,
  transportation: Number,
  accommodation: Number,
  food: Number,
  others: Number,
  total: Number,
}, { _id: false });

const HotelSchema = new mongoose.Schema({
  name: String,
  type: String,
  stars: Number,
  price_per_night: Number,
  rating: Number,
  address: String,
  lat: Number,
  lng: Number,
  image: String,
  category: String,
}, { _id: false });

const PlanSchema = new mongoose.Schema({
  trip_title: String,
  start_date: String,
  end_date: String,
  total_budget: Number,
  total_places: Number,
  recommended_hotels: [HotelSchema],
  daily_itinerary: [DailyItinerarySchema],
  daily_budget: [DailyBudgetSchema],
  total_expense_breakdown: {
    transportation: Number,
    accommodation: Number,
    food: Number,
    others: Number,
    total: Number,
  },
  route_description: mongoose.Schema.Types.Mixed,
  previewImage: String,
  province: String,
  provinceName: String,
  createdAt: { type: Date, default: Date.now },
});

const PlanModel = mongoose.model("Plan", PlanSchema);
export default PlanModel;
