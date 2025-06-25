import { Request, Response, NextFunction } from "express";
import { AppError } from "../utils/error.js";

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    // Handle known AppErrors
    res.status(err.statusCode).json({
      message: err.message,
      success: false,
    });
    return;
  }

  // Fallback internal server error
  console.error(err);
  res.status(500).json({
    message: "Internal server error",
    success: false,
  });
};
