import jwt from "jsonwebtoken";

import { Response } from "express";

const secret_key = process.env.JWT_SECRET_KEY;

if (!secret_key) {
  throw new Error("JWT_SECRET_KEY is not defined");
}

const generateTokenAndCookie = (res: Response, id: string, email: string) => {
  const token = jwt.sign({ userId: id, email: email }, secret_key, {
    expiresIn: "7d",
  });

  res.cookie("token", token, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    path: "/",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  return token;
};

export default generateTokenAndCookie;
