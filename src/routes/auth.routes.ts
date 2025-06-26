import express from "express";
import passport from "passport";
import {
  callback,
  getUser,
  login,
  logout,
  register,
} from "../controllers/auth.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/logout", verifyToken, logout);
authRouter.get("/me", verifyToken, getUser);

authRouter.get(
  "/google",
  passport.authenticate("google", {
    scope: ["email", "profile"],
    session: false,
  })
);

authRouter.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${process.env.FRONTEND_URL}/login`,
  }),
  callback
);

export default authRouter;
