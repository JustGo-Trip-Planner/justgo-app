import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import config from "./config";

import provinceRoutes from "./routes/provinceRoutes";
import planRoutes from "./routes/planRoutes";
import authRoutes from './routes/auth';
import userRoutes from './routes/userRoutes';
import groupRoutes from "./routes/groupRoutes";
import uploadRoutes from './routes/upload';
import notificationRoutes from "./routes/notificationRoutes";

const app = express();
app.use(cors());
app.use(express.json());

mongoose
  .connect(config.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch((err) => console.error("Mongo connection error:", err));

app.use("/api/uploads", uploadRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/provinces", provinceRoutes);
app.use("/api/plan", planRoutes);
app.use("/api/notifications", notificationRoutes);

app.get("/api/test", (req, res) => {
  res.send("✅ Mock API is working!");
});

app.listen(config.port, () => {
  console.log(`Backend listening on http://localhost:${config.port}`);
});
