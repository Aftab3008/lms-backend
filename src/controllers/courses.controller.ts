import { Request, Response } from "express";
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

export async function getAllCourses(req: Request, res: Response) {
  try {
    const courses = await db.course.findMany({
      where: {
        published: true,
      },
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        duration: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        instructor: {
          select: {
            name: true,
            profileUrl: true,
            email: true,
          },
        },
        enrollments: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        reviews: {
          select: {
            content: true,
            rating: {
              select: {
                rating: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
      },
    });

    res.status(200).json({
      message: "Courses fetched successfully.",
      success: true,
      data: courses,
    });
  } catch (error) {
    console.error("Error fetching courses:", error);
    res.status(500).json({
      message: "Something went wrong while fetching courses.",
      success: false,
    });
  }
}

export async function getFeaturedCourses(req: Request, res: Response) {
  try {
    const count = req.query.count ? parseInt(req.query.count as string) : 3;
    const featuredCourses = await db.course.findMany({
      where: {
        published: true,
      },
      orderBy: {
        enrollments: {
          _count: "desc",
        },
      },
      take: count,
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        duration: true,
        level: true,
        createdAt: true,
        updatedAt: true,
        category: true,
        instructor: {
          select: {
            name: true,
            profileUrl: true,
            email: true,
          },
        },
        enrollments: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        reviews: {
          select: {
            content: true,
            rating: {
              select: {
                rating: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
              },
            },
          },
        },
        _count: {
          select: {
            enrollments: true,
          },
        },
      },
    });

    res.status(200).json({
      message: "Featured courses fetched successfully.",
      success: true,
      data: featuredCourses,
    });
  } catch (error) {
    console.error("Error fetching featured courses:", error);
    res.status(500).json({
      message: "Something went wrong while fetching featured courses.",
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
      select: {
        id: true,
        title: true,
        description: true,
        thumbnail: true,
        price: true,
        duration: true,
        level: true,
        language: true,
        briefDescription: true,
        objectives: true,
        requirements: true,
        OriginalPrice: true,
        createdAt: true,
        updatedAt: true,
        published: true,
        category: {
          select: {
            name: true,
          },
        },
        instructor: {
          select: {
            name: true,
            email: true,
            profileUrl: true,
          },
        },
        enrollments: {
          select: {
            user: {
              select: {
                email: true,
                name: true,
              },
            },
          },
        },
        reviews: {
          where: {
            rating: {
              rating: {
                not: null,
              },
            },
          },
          take: 10,
          orderBy: {
            rating: {
              rating: "desc",
            },
          },
          select: {
            content: true,
            createdAt: true,
            rating: {
              select: {
                rating: true,
              },
            },
            user: {
              select: {
                name: true,
                email: true,
                profileUrl: true,
              },
            },
          },
        },
        sections: {
          select: {
            title: true,
            lessons: {
              select: {
                title: true,
                duration: true,
              },
            },
          },
        },
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
