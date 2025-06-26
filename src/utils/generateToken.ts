import jwt from "jsonwebtoken";

import { Response } from "express";

const secret_key = process.env.JWT_SECRET_KEY;
const isProduction = process.env.NODE_ENV === "production";

if (!secret_key) {
  throw new Error("JWT_SECRET_KEY is not defined");
}

const generateTokenAndCookie = (res: Response, id: string, email: string) => {
  const token = jwt.sign({ userId: id, email: email }, secret_key, {
    expiresIn: "7d",
  });

  res.cookie("access_token", token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: "none",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateTokenAndCookie;
