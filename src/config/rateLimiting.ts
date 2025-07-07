import { RateLimiterRedis } from "rate-limiter-flexible";
import { redis } from "./redis.js";

export const magicLinkLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rlf:magic-link",
  points: 3, // max 3 magic-links per email...
  duration: 60 * 60, // ...per hour
  blockDuration: 60 * 15, // block for 15 min if exceeded
});

export const resendOtpLimiter = new RateLimiterRedis({
  storeClient: redis,
  keyPrefix: "rlf:resend-otp",
  points: 3, // max 3 OTPs per email...
  duration: 60 * 60, // ...per hour
  blockDuration: 60 * 15, // block for 15 min if exceeded
});
