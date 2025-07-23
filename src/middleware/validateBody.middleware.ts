import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";
import { deleteMedia } from "../utils/imageKitDelete.js";

export function validateBody(schema: ZodSchema<any>) {
  return async (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (result.success) {
      req.body = result.data;
      return next();
    }
    const { error } = result;
    const { message: errorMessages } = error;
    const parseMessage = JSON.parse(errorMessages);
    const message = parseMessage[0].message;
    const errorPath = parseMessage[0].path.join(".");
    if (req.body?.thumbnailId) {
      const thumbnailId = req.body.thumbnailId;
      const result = await deleteMedia(thumbnailId);
      if (!result.success) {
        console.error("Error deleting thumbnail from ImageKit:", result.error);
      }
    }
    if (req.body?.videoId) {
      const videoId = req.body.videoId;
      const result = await deleteMedia(videoId);
      if (!result.success) {
        console.error("Error deleting video from ImageKit:", result.error);
      }
    }
    res.status(400).json({
      message: message,
      error: errorPath,
    });
    return;
  };
}
