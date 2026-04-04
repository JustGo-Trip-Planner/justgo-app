import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "./config";
import { startCronJobs } from "./cron";

import provinceRoutes from "./routes/provinceRoutes";
import planRoutes from "./routes/planRoutes";
import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import groupRoutes from "./routes/groupRoutes";
import uploadRoutes from './routes/upload';
import notificationRoutes from "./routes/notificationRoutes";
import hotelRoutes from "./routes/hotelRoutes";
import voteRoutes from "./routes/voteRoutes";

const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("❌ Mongo connection error:", err));

app.use("/api/uploads", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/hotels", hotelRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/groups", voteRoutes);
app.use("/api/provinces", provinceRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/", (_req, res) => {
  res.send("Backend Running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || config.port;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  startCronJobs();
});