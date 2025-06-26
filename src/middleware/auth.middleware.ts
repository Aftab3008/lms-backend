import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RequestWithUserId } from "../types/index.js";
import { AppError } from "../utils/error.js";

const secret_key = process.env.JWT_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const { TokenExpiredError, JsonWebTokenError } = jwt;

if (!secret_key) {
  throw new AppError("Secret key not found", 500);
}
if (!FRONTEND_URL) {
  throw new AppError("FRONTEND_URL not defined", 500);
}

export const verifyToken = async (
  req: RequestWithUserId,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.access_token;
  if (!token) {
    throw new AppError("User unauthorized", 401);
  }

  try {
    const decoded = jwt.verify(token, secret_key) as jwt.JwtPayload;
    req.userId = decoded.userId;
    next();
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
      });
      return res.redirect(`${FRONTEND_URL}/signin`);
    }

    if (err instanceof JsonWebTokenError) {
      throw new AppError("Invalid token", 401);
    }
    throw new AppError("Internal server error", 500);
  }
};
