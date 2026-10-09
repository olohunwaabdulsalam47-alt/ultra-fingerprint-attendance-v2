import cors from "cors";
import express, { type Request, type Response } from "express";
import helmet from "helmet";

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(
  cors({
    origin: process.env.FRONTEND_ORIGIN
      ? process.env.FRONTEND_ORIGIN.split(",").map((origin) => origin.trim())
      : false,
    methods: ["GET", "POST", "PATCH", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

app.use(express.json({ limit: "100kb" }));

app.get("/api/health", (_request: Request, response: Response) => {
  response.status(200).json({
    success: true,
    message: "Ultra Fingerprint Attendance API is running.",
    timestamp: new Date().toISOString(),
  });
});

app.use((_request: Request, response: Response) => {
  response.status(404).json({
    success: false,
    message: "API endpoint not found.",
  });
});

export default app;
