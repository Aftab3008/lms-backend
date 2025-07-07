import bcrypt from "bcryptjs";
import { Request, Response } from "express";
import { redis } from "../config/redis.js";
import { otpService } from "../services/otp.services.js";
import { RequestWithUserId } from "../types/index.js";
import db from "../utils/db.js";
import {
  clearAccessTokenCookie,
  clearOtpCookie,
  generateTokenAndCookie,
} from "../utils/generateToken.js";

export const login = async (req: Request, res: Response) => {
  const { email, password } = req.body;

  try {
    const user = await db.user.findUnique({
      where: {
        email,
      },
      select: {
        id: true,
        email: true,
        password: true,
        isVerified: true,
        name: true,
        profileUrl: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User does not exist", success: false });
      return;
    }
    if (!user.password) {
      res
        .status(400)
        .json({ message: "Please set a password to continue", success: false });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.password);

    if (!validPassword) {
      res
        .status(401)
        .json({ message: "Invalid Email or Password", success: false });
      return;
    }

    if (!user.isVerified) {
      const result = await otpService(res, user.id, user.email);

      if (!result.success) {
        clearOtpCookie(res);
        res.status(500).json({ message: "Failed to send OTP", success: false });
        return;
      }

      res.status(403).json({
        message: "Please verify your email to continue",
        redirectUrl: `${process.env.FRONTEND_URL}/auth/verify-email`,
        success: false,
      });
      return;
    }

    const token = generateTokenAndCookie(res, user.id, user.email);

    if (!token.success) {
      res.status(500).json({ message: token.message, success: false });
      return;
    }

    const data = await db.user.update({
      where: {
        id: user.id,
      },
      data: {
        lastLogin: new Date(),
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileUrl: true,
      },
    });
    await redis.set(
      `user:${user.id}`,
      JSON.stringify({
        id: data.id,
        email: data.email,
        name: data.name,
        profileUrl: data.profileUrl,
      }),
      "EX",
      60 * 60 * 24 // Cache for 24 hours
    );
    res.status(200).json({
      message: "User logged in successfully",
      data,
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
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
      select: {
        id: true,
        email: true,
      },
    });

    if (user) {
      res.status(400).json({ message: "User already exists", success: false });
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
      select: {
        id: true,
        email: true,
        name: true,
        profileUrl: true,
        isVerified: true,
      },
    });

    if (!newUser) {
      res.status(500).json({
        message: "Failed to create account, Please try again later",
        success: false,
      });
      return;
    }

    const result = await otpService(res, newUser.id, newUser.email);

    if (!result.success) {
      clearOtpCookie(res);
      res.status(500).json({ message: "Failed to send OTP", success: false });
      return;
    }
    res.status(201).json({
      message: "Please verify your email to complete registration",
      success: true,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Internal server error", success: false });
    return;
  }
};

export const logout = async (req: Request, res: Response) => {
  clearAccessTokenCookie(res);
  res
    .status(200)
    .json({ message: "User logged out successfully", success: true });
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

    const redirectURL = `${process.env.FRONTEND_URL}/`; //oauth2/redirect?token=${token}
    res.redirect(redirectURL);
  } catch (error) {
    console.error("OAuth callback error:", error);
    res.redirect(`${process.env.FRONTEND_URL}/login`);
  }
};

export const getUser = async (req: RequestWithUserId, res: Response) => {
  const userId = req.userId;

  try {
    const cachedUser = await redis.get(`user:${userId}`);
    if (cachedUser) {
      res.status(200).json({
        data: JSON.parse(cachedUser),
        success: true,
      });
      return;
    }

    const user = await db.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileUrl: true,
        isVerified: true,
      },
    });

    if (!user) {
      res.status(404).json({ message: "User not found", success: false });
      return;
    }
    // if (!user.isVerified) {
    //   const otp = generateSecureOTP();

    //   const newOtp = await db.otp.create({
    //     data: {
    //       userId: user.id,
    //       otp,
    //       expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    //     },
    //     select: {
    //       id: true,
    //       otp: true,
    //       expiresAt: true,
    //     },
    //   });

    //   if (!newOtp) {
    //     res
    //       .status(500)
    //       .json({ message: "Failed to create OTP", success: false });
    //     return;
    //   }

    //   const otpToken = generateOtpToken(res, user.id, user.email, newOtp.id);

    //   if (!otpToken.success) {
    //     res.status(500).json({ message: otpToken.message, success: false });
    //     return;
    //   }

    //   const result = await sendOtpNotification(user.email, otp);

    //   if (!result.success) {
    //     clearOtpCookie(res);
    //     res.status(500).json({ message: "Failed to send OTP", success: false });
    //     return;
    //   }

    //   res.status(403).json({
    //     message: "Please verify your email to continue",
    //     redirectUrl: `${process.env.FRONTEND_URL}/verify-email`,
    //     success: false,
    //   });
    //   return;
    // }

    await redis.set(
      `user:${userId}`,
      JSON.stringify({
        id: user.id,
        email: user.email,
        name: user.name,
        profileUrl: user.profileUrl,
      }),
      "EX",
      60 * 60 * 24 // Cache for 24 hours
    );

    res.status(200).json({
      data: {
        ...user,
        isVerified: undefined,
      },
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
    return;
  }
};

export const verifyOtp = async (req: RequestWithUserId, res: Response) => {
  const userId = req.userId;
  const otpId = req.otpId;
  const { otp } = req.body;

  try {
    const otpRecord = await db.otp.findUnique({
      where: {
        id: otpId,
      },
    });

    if (!otpRecord) {
      res.status(404).json({ message: "OTP not found", success: false });
      return;
    }

    if (new Date() > otpRecord.expiresAt) {
      res.status(400).json({ message: "OTP expired", success: false });
      return;
    }
    if (otpRecord.userId !== userId) {
      res.status(403).json({ message: "Unauthorized", success: false });
      return;
    }

    if (otpRecord.otp !== otp) {
      res.status(400).json({ message: "Invalid OTP", success: false });
      return;
    }
    const updatedUser = await db.user.update({
      where: {
        id: userId,
      },
      data: {
        isVerified: true,
      },
      select: {
        id: true,
        email: true,
        name: true,
        profileUrl: true,
      },
    });
    await db.otp.delete({
      where: {
        id: otpId,
      },
    });
    clearOtpCookie(res);
    const token = generateTokenAndCookie(
      res,
      updatedUser.id,
      updatedUser.email
    );

    if (!token.success) {
      res.status(500).json({ message: token.message, success: false });
      return;
    }
    await redis.set(
      `user:${userId}`,
      JSON.stringify({
        id: updatedUser.id,
        email: updatedUser.email,
        name: updatedUser.name,
        profileUrl: updatedUser.profileUrl,
      }),
      "EX",
      60 * 60 * 24
    );
    res.status(200).json({
      message: "Email verified successfully",
      data: {
        ...updatedUser,
      },
      success: true,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};
