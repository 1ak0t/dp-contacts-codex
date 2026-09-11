import cors from "cors";
import express from "express";
import { config } from "./config.js";
import { authRouter } from "./routes/authRoutes.js";
import { contactsRouter } from "./routes/contactsRoutes.js";

export const app = express();

app.use(
  cors({
    origin(origin, callback) {
      if (!origin || config.corsOrigins.includes(origin)) {
        callback(null, true);
        return;
      }

      callback(new Error("Not allowed by CORS"));
    },
    allowedHeaders: ["Content-Type", "Authorization"],
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  }),
);
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ status: "ok" });
});

app.use("/auth", authRouter);
app.use("/", contactsRouter);

app.use((_request, response) => {
  response.status(404).json({ message: "Not found" });
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  console.error(error);
  response.status(500).json({ message: "Internal server error" });
});
