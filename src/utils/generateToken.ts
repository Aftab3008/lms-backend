import jwt from "jsonwebtoken";

import { Response } from "express";

const secret_key = process.env.JWT_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";

if (!secret_key) {
  throw new Error("JWT_SECRET_KEY is not defined");
}

export const generateTokenAndCookie = (
  res: Response,
  id: string,
  email: string
) => {
  const token = jwt.sign({ userId: id, email: email }, secret_key, {
    expiresIn: "7d",
  });

  if (!token) {
    return { message: "Failed to generate token", success: false };
  }

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return {
    message: "Token generated successfully",
    token: token,
    success: true,
  };
};

export const generateOtpToken = (
  res: Response,
  id: string,
  email: string,
  otpId: string
) => {
  const otpToken = jwt.sign(
    { userId: id, email: email, purpose: "verify-otp", otpId: otpId },
    secret_key,
    {
      expiresIn: "15m",
    }
  );
  if (!otpToken) {
    return { message: "Failed to generate OTP token", success: false };
  }
  res.cookie("otp_token", otpToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
    maxAge: 10 * 60 * 1000,
  });

  return {
    message: "OTP token generated successfully",
    token: otpToken,
    success: true,
  };
};

export const clearOtpCookie = (res: Response) => {
  res.clearCookie("otp_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
  return {
    message: "OTP cookie cleared successfully",
    success: true,
  };
};

export const clearAccessTokenCookie = (res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? "none" : "lax",
    path: "/",
  });
  return {
    message: "Access token cookie cleared successfully",
    success: true,
  };
};
