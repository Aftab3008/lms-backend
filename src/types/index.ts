import { Request } from "express";

export interface PassportUser {
  id: string;
}

declare global {
  namespace Express {
    interface User extends PassportUser {}
  }
}

export interface RequestWithUserId extends Request {
  userId?: string;
}
