import dotenv from "dotenv";
import path from "path";

dotenv.config({
  path: path.resolve(__dirname, "../.env")
});

interface Config {
  port: number;
  RAG_URL: string;
  MONGO_URI: string;
  JWT_SECRET: string;

  CLOUDINARY_CLOUD_NAME: string;
  CLOUDINARY_API_KEY: string;
  CLOUDINARY_API_SECRET: string;
}

const config: Config = {
  port: Number(process.env.PORT) || 3000,
  RAG_URL: process.env.RAG_URL || "http://localhost:8000",
  MONGO_URI: process.env.MONGO_URI || "mongodb://localhost:27017/justgo-db",
  JWT_SECRET: process.env.JWT_SECRET || 'fallbackkey',

  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || "",
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || "",
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || "",
};

export default config;
