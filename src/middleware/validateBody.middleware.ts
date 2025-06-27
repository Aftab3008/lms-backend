import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

export function validateBody(schema: ZodSchema<any>) {
  return (req: Request, res: Response, next: NextFunction) => {
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
    res.status(400).json({
      message: message,
      error: errorPath,
    });
    return;
  };
}
