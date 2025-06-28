import { sendToQueue } from "../config/rabbitmq.js";

const QUEUE_NAME = process.env.RABBITMQ_QUEUE_NAME || "notifications";

export const sendOtpNotification = async (email: string, otp: string) => {
  return await sendToQueue(QUEUE_NAME, {
    type: "send-otp",
    email,
    otp,
    timestamp: new Date().toISOString(),
  });
};
