import { Prisma } from "@prisma/client";
import { Response } from "express";
import { RequestWithUserId } from "../types/index.js";
import db from "../utils/db.js";

export async function getCategories(req: RequestWithUserId, res: Response) {
  try {
    const categories = await db.category.findMany({
      select: {
        name: true,
      },
    });
    res.status(200).json({
      message: "Categories fetched successfully",
      success: true,
      data: categories,
      count: categories.length,
    });
  } catch (error) {
    console.error("Error fetching categories:", error);
    res.status(500).json({
      message: "Something went wrong.",
      success: false,
    });
  }
}

export async function getCourseById(req: RequestWithUserId, res: Response) {
  const { courseId } = req.params;

  if (!courseId) {
    res.status(400).json({
      message: "Course ID is required.",
      success: false,
    });
    return;
  }

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      include: {
        category: true,
        instructor: true,
      },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found.",
        success: false,
      });
      return;
    }

    res.status(200).json({
      message: "Course fetched successfully.",
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error fetching course:", error);
    res.status(500).json({
      message: "Something went wrong while fetching the course.",
      success: false,
    });
  }
}

export async function getAllCourses(req: RequestWithUserId, res: Response) {
  try {
    const courses = await db.course.findMany({
      include: {
        category: true,
        instructor: true,
      },
    });

    res.status(200).json({
      message: "Courses fetched successfully.",
      success: true,
      data: courses,
      count: courses.length,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      message: "Something went wrong while fetching courses.",
      success: false,
    });
  }
}
