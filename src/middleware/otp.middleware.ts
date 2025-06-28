import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { RequestWithUserId } from "../types/index.js";
import { AppError } from "../utils/error.js";
import { clearOtpCookie } from "../utils/generateToken.js";

const secret_key = process.env.JWT_SECRET_KEY;
const FRONTEND_URL = process.env.FRONTEND_URL;
const { TokenExpiredError, JsonWebTokenError } = jwt;

if (!secret_key) {
  throw new AppError("Secret key not found", 500);
}
if (!FRONTEND_URL) {
  throw new AppError("FRONTEND_URL not defined", 500);
}

export const verifyOtpToken = async (
  req: RequestWithUserId,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const token = req.cookies.otp_token;
  if (!token) {
    throw new AppError("User unauthorized", 401);
  }

  try {
    const decoded = jwt.verify(token, secret_key) as jwt.JwtPayload;
    req.userId = decoded.userId;
    req.otpId = decoded.otpId;
    next();
  } catch (err: any) {
    if (err instanceof TokenExpiredError) {
      clearOtpCookie(res);
      res.status(401).json({
        message: "Token expired, please request a new OTP",
        success: false,
      });
      return;
    }

    if (err instanceof JsonWebTokenError) {
      throw new AppError("Invalid token", 401);
    }
    throw new AppError("Internal server error", 500);
  }
};
