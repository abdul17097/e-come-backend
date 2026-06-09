import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import errorHandler from "./middlewares/errorMiddleware.js";
import allRoutes from "./routes/index.js";
import { dbConnection } from "./config/db.js";
import cookieParser from "cookie-parser";
import { cloudinaryConfig } from "./config/cloudinary.js";

dotenv.config();
dbConnection();
cloudinaryConfig();
const app = express();
app.use(cookieParser());
const PORT = process.env.PORT || 5000;

app.use(
  cors({
    origin: "https://e-come-frontend.vercel.app" || "*",
    credentials: true,
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
    ],
  }),
);
app.use(
  express.json({
    limit: "50mb",
  }),
);

app.use("/api", allRoutes);
app.use(errorHandler);

if (process.env.NODE_ENV !== "production") {
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT}`);
  });
}

export default app;
