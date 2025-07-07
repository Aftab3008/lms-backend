import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import passport from "passport";
import configurePassport from "./config/passport.js";
import { errorHandler } from "./middleware/error.middleware.js";
import authRouter from "./routes/auth.routes.js";

dotenv.config();

const app = express();
const port = process.env.PORT || 3000;

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    credentials: true,
  })
);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

configurePassport();

app.use(passport.initialize());

app.use("/api/auth", authRouter);

// Global error handler (should be the last middleware)
app.use(errorHandler);

app.listen(port, async () => {
  console.log(`Server is running at http://localhost:${port}`);
});
