import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { RequestWithUserId } from "../types/index.js";
import db from "../utils/db.js";
import generateTokenAndCookie from "../utils/generateToken.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User does not exist" });
      return;
    }
    if (!user.password) {
      res
        .status(400)
        .json({ message: "Password not set, Please set a password" });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res.status(401).json({ message: "Invalid Email or Password" });
      return;
    }

    const token = generateTokenAndCookie(res, user.id, user.email);

    user.lastLogin = new Date();

    await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLogin: user.lastLogin,
      },
    });

    res.status(200).json({
      message: "User logged in successfully",
      data: {
        ...user,
        password: undefined,
      },
      token: token,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const register = async (req: Request, res: Response) => {
  const { email, password, name, agreeToTerms, agreeToPrivacyPolicy } =
    req.body;

  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
    });

    if (user) {
      res.status(400).json({ message: "User already exists" });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await db.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        lastLogin: new Date(),
        profileUrl: "/assets/default.jpg",
        agreeToTerms,
        agreeToPrivacyPolicy,
      },
    });

    const token = generateTokenAndCookie(res, newUser.id, newUser.email);

    //TODO: Email verification logic can be added here

    res.status(201).json({
      message: "User created successfully",
      data: {
        ...newUser,
        password: undefined,
      },
      token: token,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};

export const logout = async (req: Request, res: Response) => {
  res.clearCookie("access_token", {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "none",
  });
  res.status(200).json({ message: "User logged out successfully" });
  return;
};

export const callback = async (req: Request, res: Response) => {
  try {
    if (!req.user?.id) {
      console.error("Missing user ID in OAuth callback");
      res.redirect(`${process.env.FRONTEND_URL}/login?error=auth_failed`);
      return;
    }

    const userId = req.user.id;

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
    });

    if (!user) {
      console.error(`User with ID ${userId} not found in database`);
      res.redirect(`${process.env.FRONTEND_URL}/login?error=user_not_found`);
      return;
    }

    const token = generateTokenAndCookie(res, user.id, user.email);

    const redirectURL = `${process.env.FRONTEND_URL}/oauth2/redirect?token=${token}`;
    res.redirect(redirectURL);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

export const getUser = async (req: RequestWithUserId, res: Response) => {
  const userId = req.userId;

  try {
    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      omit: {
        password: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found" });
      return;
    }

    res.status(200).json({
      data: {
        ...user,
      },
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error" });
    return;
  }
};
