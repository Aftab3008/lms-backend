import { RequestWithUserId } from "../types/index.js";
import { Response } from "express";
import db from "../utils/db.js";
import imagekit, { publicKey } from "../config/imagekit.js";

export async function getAuthentication(req: RequestWithUserId, res: Response) {
  try {
    const { userId } = req;
    const user = await db.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        roles: true,
        profileUrl: true,
      },
    });

    if (!user) {
      res.status(404).json({
        message: "User not found.",
        success: false,
      });
      return;
    }
    const { token, signature, expire } = imagekit.getAuthenticationParameters();

    res.status(200).json({
      message: "ImageKit authentication successful.",
      success: true,
      data: {
        token,
        signature,
        expire,
        publicKey,
      },
    });
  } catch (error: any) {
    console.error("Error in authentication:", error);
    res.status(500).json({
      message: error.message || "Something went wrong during authentication.",
      success: false,
    });
  }
}
