import express from "express";
import passport from "passport";
import {
  login,
  register,
  logout,
  callback,
} from "../controllers/auth.controller.js";
import generateTokenAndCookie from "../utils/generateToken.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const authRouter = express.Router();

authRouter.post("/login", login);
authRouter.post("/register", register);
authRouter.post("/logout", verifyToken, logout);

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
