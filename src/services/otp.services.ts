import { Response } from "express";
import { sendToQueue } from "../config/rabbitmq.js";
import { generateSecureOTP } from "../lib/utils.js";
import db from "../utils/db.js";
import { generateOtpToken } from "../utils/generateToken.js";

const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || "notifications";

export const sendOtpNotification = async (email: string, otp: string) => {
  return await sendToQueue(QUEUE_NAME, {
    type: "send-otp",
    email,
    otp,
    timestamp: new Date().toISOString(),
  });
};

export async function otpService(res: Response, userId: string, email: string) {
  try {
    const otp = generateSecureOTP();

    const newOtp = await db.otp.create({
      data: {
        userId: userId,
        otp,
        expiresAt: new Date(Date.now() + 15 * 60 * 1000),
      },
      select: {
        id: true,
        otp: true,
        expiresAt: true,
      },
    });

    if (!newOtp) {
      return { message: "Failed to create OTP", success: false };
    }

    const otpToken = generateOtpToken(res, userId, email, newOtp.id);

    if (!otpToken.success) {
      return { message: otpToken.message, success: false };
    }
    const result = await sendOtpNotification(email, otp);

    if (!result.success) {
      return { message: "Failed to send OTP notification", success: false };
    }
    return {
      message: "OTP sent successfully",
      success: true,
      otpToken: otpToken.token,
    };
  } catch (error) {
    console.error("Error in otpService:", error);
    return { message: "Internal server error", success: false };
  }
}
