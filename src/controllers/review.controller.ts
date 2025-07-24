import { Response } from "express";
import { RequestWithUserId } from "../types/index.js";
import db from "../utils/db.js";

export async function createReview(req: RequestWithUserId, res: Response) {
  const { courseId, content, rating } = req.body;
  const { userId } = req;

  try {
    const existingReview = await db.review.findFirst({
      where: {
        courseId,
        userId,
      },
    });

    if (existingReview) {
      return res.status(400).json({
        message: "You have already reviewed this course.",
        success: false,
      });
    }

    const newReview = await db.review.create({
      data: {
        content,
        rating: {
          connect: { id: rating },
        },
        course: {
          connect: { id: courseId },
        },
        user: {
          connect: { id: userId },
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            profileUrl: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Review created successfully.",
      success: true,
      review: newReview,
    });
  } catch (error) {
    console.error("Error creating review:", error);
    res.status(500).json({
      message: "Internal server error.",
      success: false,
    });
  }
}
