import { Prisma } from "@prisma/client";
import { Response } from "express";
import { RequestWithUserId } from "../types/index.js";
import db from "../utils/db.js";
import { deleteMedia, deleteMultipleMedia } from "../utils/imageKitDelete.js";

export async function getCoursesByInstructor(
  req: RequestWithUserId,
  res: Response
) {
  const { userId } = req;
  try {
    const courses = await db.course.findMany({
      where: { instructorId: userId },
      select: {
        id: true,
        title: true,
        thumbnail: true,
        published: true,
        enrollments: true,
        updatedAt: true,
        reviews: {
          select: {
            id: true,
            rating: {
              select: {
                id: true,
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
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500).json({
        message: "Something went wrong while fetching courses.",
        success: false,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        message: "Something went wrong while fetching courses.",
        success: false,
      });
    }
  }
}

export async function createCategory(req: RequestWithUserId, res: Response) {
  try {
    const { name } = req.body;

    if (!name) {
      res.status(400).json({
        message: "Category name is required.",
        success: false,
      });
      return;
    }

    const category = await db.category.create({
      data: { name },
    });

    res.status(201).json({
      message: "Category created successfully.",
      success: true,
      data: category,
    });
  } catch (error) {
    console.error("Error creating category:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2002") {
        res.status(400).json({
          message: "Category already exists.",
          success: false,
        });
        return;
      } else if (error.code === "P2006") {
        res.status(400).json({
          message: "Invalid data provided.",
          success: false,
        });
        return;
      } else {
        res.status(500).json({
          message: "Something went wrong.",
          success: false,
        });
        return;
      }
    } else {
      res.status(500).json({
        message: "Something went wrong.",
        success: false,
      });
    }
  }
}

export async function createCourse(req: RequestWithUserId, res: Response) {
  try {
    const {
      title,
      description,
      category,
      level,
      price,
      briefDescription,
      requirements,
      objectives,
      language,
    } = req.body;
    const userId = req.userId;

    if (!userId) {
      res.status(401).json({
        message: "User not authenticated.",
        success: false,
      });
      return;
    }
    const categoryExists = await db.category.findUnique({
      where: { name: category },
    });

    if (!categoryExists) {
      res.status(400).json({
        message: "Category does not exist.",
        success: false,
      });
      return;
    }

    const course = await db.course.create({
      data: {
        title,
        description,
        categoryId: categoryExists.id,
        level,
        price,
        OriginalPrice: price,
        duration: 0,
        instructorId: userId,
        briefDescription,
        requirements,
        objectives,
        language,
      },
      select: {
        id: true,
        title: true,
        description: true,
        briefDescription: true,
        category: {
          select: {
            name: true,
            id: true,
          },
        },
      },
    });

    res.status(201).json({
      message: "Course created successfully.",
      success: true,
      data: course,
    });
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({
      message: "Something went wrong while creating the course.",
      success: false,
    });
  }
}

export async function getCourseByIdInstructor(
  req: RequestWithUserId,
  res: Response
) {
  const { courseId } = req.params;
  const { userId } = req;

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
        briefDescription: true,
        requirements: true,
        objectives: true,
        language: true,
        level: true,
        price: true,
        duration: true,
        OriginalPrice: true,
        thumbnail: true,
        instructorId: true,
        category: {
          select: {
            name: true,
          },
        },
        instructor: {
          select: {
            name: true,
            email: true,
          },
        },
        sections: {
          orderBy: { order: "asc" },
          select: {
            id: true,
            title: true,
            description: true,
            order: true,
            lessons: {
              orderBy: { order: "asc" },
              select: {
                id: true,
                title: true,
                description: true,
                duration: true,
                order: true,
                fileName: true,
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
    if (course.instructorId !== userId) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }
    res.status(200).json({
      message: "Course fetched successfully.",
      success: true,
      data: { ...course, instructorId: undefined },
    });
  } catch (error: any) {
    console.log("Error fetching course:", error);
    res.status(500).json({
      message:
        error.message || "Something went wrong while fetching the course.",
      success: false,
    });
  }
}

export async function createSection(req: RequestWithUserId, res: Response) {
  const { courseId } = req.params;
  const { title, description, order } = req.body;
  const { userId } = req;

  if (!courseId || !title) {
    res.status(400).json({
      message: "Course ID and title are required.",
      success: false,
    });
    return;
  }

  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found.",
        success: false,
      });
      return;
    }

    if (course.instructorId !== userId) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }
    const section = await db.section.create({
      data: {
        courseId,
        title,
        description,
        order,
      },
      select: {
        title: true,
        description: true,
        order: true,
      },
    });

    res.status(201).json({
      message: "Section created successfully.",
      success: true,
      data: section,
    });
  } catch (error: any) {
    console.error("Error creating section:", error);
    res.status(500).json({
      message:
        error.message || "Something went wrong while creating the section.",
      success: false,
    });
  }
}

export async function addLessonToSection(
  req: RequestWithUserId,
  res: Response
) {
  const { sectionId, courseId } = req.params;
  const { title, description, duration, videoUrl, order, videoId, fileName } =
    req.body;
  const { userId } = req;

  if (!sectionId || !title) {
    res.status(400).json({
      message: "Section ID and title are required.",
      success: false,
    });
    return;
  }

  try {
    const section = await db.section.findUnique({
      where: { id: sectionId },
      select: { course: { select: { instructorId: true, id: true } } },
    });

    if (!section) {
      res.status(404).json({
        message: "Section not found.",
        success: false,
      });
      return;
    }

    if (
      section.course.instructorId !== userId ||
      section.course.id !== courseId
    ) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    const lesson = await db.$transaction([
      db.section.update({
        where: { id: sectionId },
        data: {
          duration: {
            increment: duration,
          },
        },
      }),
      db.course.update({
        where: { id: courseId },
        data: {
          duration: {
            increment: duration,
          },
        },
      }),
      db.lesson.create({
        data: {
          sectionId,
          title,
          description,
          duration,
          videoUrl,
          videoId,
          order,
          fileName,
        },
        select: {
          title: true,
          description: true,
          duration: true,
          videoUrl: true,
          order: true,
        },
      }),
    ]);
    console.log("Lesson created:", lesson);
    res.status(201).json({
      message: "Lesson added successfully.",
      success: true,
      data: lesson,
    });
  } catch (error: any) {
    console.error("Error updating lesson order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        res.status(500).json({
          message: "Failed to create. Please try again later.",
          success: false,
        });
      } else {
        res.status(500).json({
          message: "Something went wrong. Please try again later.",
          success: false,
        });
      }
    } else {
      if (error instanceof Error) {
        res.status(500).json({
          message:
            error.message ||
            "Something went wrong while updating the lesson order.",
          success: false,
        });
      }
    }
  }
}

export async function deleteLessonInSection(
  req: RequestWithUserId,
  res: Response
) {
  const { sectionId, lessonId, courseId } = req.params;
  const { userId } = req;

  if (!sectionId || !lessonId || !courseId) {
    res.status(400).json({
      message: "Section ID, lesson ID, and course ID are required.",
      success: false,
    });
    return;
  }

  try {
    const section = await db.section.findUnique({
      where: { id: sectionId },
      select: {
        course: { select: { instructorId: true, id: true } },
        lessons: {
          where: { id: lessonId },
          select: {
            id: true,
            title: true,
            videoId: true,
            duration: true,
            videoUrl: true,
          },
        },
      },
    });

    if (!section) {
      res.status(404).json({
        message: "Section not found.",
        success: false,
      });
      return;
    }

    if (
      section.course.instructorId !== userId ||
      section.course.id !== courseId
    ) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }
    const videoId = section.lessons[0]?.videoId;

    const lessonDuration = section.lessons[0]?.duration || 0;

    const update = await db.$transaction([
      db.section.update({
        where: { id: sectionId },
        data: {
          duration: {
            decrement: lessonDuration,
          },
        },
      }),
      db.course.update({
        where: { id: courseId },
        data: {
          duration: {
            decrement: lessonDuration,
          },
        },
      }),
      db.lesson.delete({
        where: { id: lessonId },
      }),
    ]);
    console.log("Lesson deleted:", update);
    if (videoId) {
      const deleteVideo = await deleteMedia(videoId);
      if (!deleteVideo.success) {
        console.error("Error deleting video from ImageKit:", deleteVideo.error);
      }
    }
    res.status(200).json({
      message: "Lesson deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error deleting lesson:", error);
    res.status(500).json({
      message: "Something went wrong while deleting the lesson.",
      success: false,
    });
  }
}

export async function updateSectionOrder(
  req: RequestWithUserId,
  res: Response
) {
  const { courseId } = req.params;
  const { userId } = req;
  const { section1, section2 } = req.body;

  if (!section1 || !section2) {
    res.status(400).json({
      message: "Section ID and order are required.",
      success: false,
    });
    return;
  }
  try {
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: {
        instructorId: true,
        sections: { select: { id: true, order: true } },
      },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found.",
        success: false,
      });
      return;
    }

    if (course.instructorId !== userId) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    const sectionToUpdate = course.sections.find(
      (section) => section.id === section1.id
    );

    const sectionToMove = course.sections.find(
      (section) => section.id === section2.id
    );

    if (!sectionToUpdate || !sectionToMove) {
      res.status(404).json({
        message: "Section not found.",
        success: false,
      });
      return;
    }

    await db.$transaction([
      db.section.update({
        where: { id: sectionToUpdate.id },
        data: { order: sectionToMove.order },
      }),
      db.section.update({
        where: { id: sectionToMove.id },
        data: { order: sectionToUpdate.order },
      }),
    ]);

    res.status(200).json({
      message: "Section order updated successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error updating section order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        res.status(500).json({
          message: "Failed to update. Please try again later.",
          success: false,
        });
      } else {
        res.status(500).json({
          message: "Something went wrong. Please try again later.",
          success: false,
        });
      }
    } else if (error instanceof Error) {
      res.status(500).json({
        message:
          error.message ||
          "Something went wrong while updating the section order.",
        success: false,
      });
    }
  }
}

export async function updateLessonOrder(req: RequestWithUserId, res: Response) {
  const { sectionId, courseId } = req.params;
  const { userId } = req;
  const { lesson1, lesson2 } = req.body;

  if (!lesson1 || !lesson2) {
    res.status(400).json({
      message: "Lesson ID and order are required.",
      success: false,
    });
    return;
  }

  try {
    const section = await db.section.findUnique({
      where: { id: sectionId },
      select: {
        course: { select: { instructorId: true, id: true } },
        lessons: { select: { id: true, order: true } },
      },
    });

    if (!section) {
      res.status(404).json({
        message: "Section not found.",
        success: false,
      });
      return;
    }

    if (
      section.course.instructorId !== userId ||
      section.course.id !== courseId
    ) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    const lessonToUpdate = section.lessons.find(
      (lesson) => lesson.id === lesson1.id
    );

    const lessonToMove = section.lessons.find(
      (lesson) => lesson.id === lesson2.id
    );

    if (!lessonToUpdate || !lessonToMove) {
      res.status(404).json({
        message: "Lesson not found.",
        success: false,
      });
      return;
    }

    await db.$transaction([
      db.lesson.update({
        where: { id: lessonToUpdate.id },
        data: { order: lessonToMove.order },
      }),
      db.lesson.update({
        where: { id: lessonToMove.id },
        data: { order: lessonToUpdate.order },
      }),
    ]);

    res.status(200).json({
      message: "Lesson order updated successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error updating lesson order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        res.status(500).json({
          message: "Failed to update.Please try again later.",
          success: false,
        });
      } else {
        res.status(500).json({
          message: "Something went wrong.Please try again later.",
          success: false,
        });
      }
    } else {
      if (error instanceof Error) {
        res.status(500).json({
          message:
            error.message ||
            "Something went wrong while updating the lesson order.",
          success: false,
        });
      }
    }
  }
}

export async function updateCourseDetails(
  req: RequestWithUserId,
  res: Response
) {
  const { courseId } = req.params;
  const {
    title,
    description,
    category,
    level,
    price,
    briefDescription,
    requirements,
    objectives,
    language,
  } = req.body;
  const { userId } = req;

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
      select: { instructorId: true },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found.",
        success: false,
      });
      return;
    }

    if (course.instructorId !== userId) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        title,
        description,
        category: {
          connect: { name: category.name },
        },
        level,
        price,
        OriginalPrice: price,
        briefDescription,
        requirements,
        objectives,
        language,
      },
    });

    res.status(200).json({
      message: "Course details updated successfully.",
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error updating course details:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      res.status(500).json({
        message: "Something went wrong. Please try again later.",
        success: false,
      });
      return;
    }
    if (error instanceof Error) {
      res.status(500).json({
        message:
          error.message || "Something went wrong. Please try again later.",
        success: false,
      });
    }
  }
}

export async function updateCourseSettings(
  req: RequestWithUserId,
  res: Response
) {
  const { courseId } = req.params;
  const { userId } = req;

  if (!courseId) {
    res.status(400).json({
      message: "Course ID is required.",
      success: false,
    });
    return;
  }

  try {
    const { thumbnailId, thumbnailUrl, fileName } = req.body;
    const course = await db.course.findUnique({
      where: { id: courseId },
      select: { instructorId: true, thumbnailId: true, thumbnail: true },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found.",
        success: false,
      });
      return;
    }

    if (course.instructorId !== userId) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    if (thumbnailId && course.thumbnailId) {
      const deleteThumbnail = await deleteMedia(course.thumbnailId);
      if (!deleteThumbnail.success) {
        console.error("Error deleting thumbnail:", deleteThumbnail.error);
      }
    }

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: {
        thumbnail: thumbnailUrl,
        thumbnailId,
        thumbnailFile: fileName,
      },
    });

    res.status(200).json({
      message: "Course settings updated successfully.",
      success: true,
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      console.error("Error updating course settings:", error);
      res.status(500).json({
        message: "Something went wrong. Please try again later.",
        success: false,
      });
    } else if (error instanceof Error) {
      res.status(500).json({
        message:
          error.message || "Something went wrong. Please try again later.",
        success: false,
      });
      return;
    }
  }
}

export async function deleteSection(req: RequestWithUserId, res: Response) {
  const { sectionId, courseId } = req.params;
  const { userId } = req;

  if (!sectionId || !courseId) {
    res.status(400).json({
      message: "Section ID and course ID are required.",
      success: false,
    });
    return;
  }

  try {
    const section = await db.section.findUnique({
      where: {
        id: sectionId,
      },
      select: {
        course: { select: { instructorId: true, id: true } },
        lessons: { select: { videoId: true } },
      },
    });

    if (!section) {
      res.status(404).json({
        message: "Section not found.",
        success: false,
      });
      return;
    }

    if (
      section.course.instructorId !== userId ||
      section.course.id !== courseId
    ) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }
    let toDeleteVideo: string[] = [];
    for (const lesson of section.lessons) {
      if (lesson.videoId) {
        toDeleteVideo.push(lesson.videoId);
      }
    }

    await db.$transaction([
      db.lesson.deleteMany({
        where: { sectionId },
      }),
      db.section.delete({
        where: { id: sectionId },
      }),
    ]);

    if (toDeleteVideo.length > 0) {
      const deleteVideos = await deleteMultipleMedia(toDeleteVideo);
      if (!deleteVideos.success) {
        console.error(
          "Error deleting videos from ImageKit:",
          deleteVideos.error
        );
      }
    }

    res.status(200).json({
      message: "Section deleted successfully.",
      success: true,
    });
  } catch (error) {
    console.error("Error updating lesson order:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        res.status(500).json({
          message: "Failed to update.Please try again later.",
          success: false,
        });
      } else {
        res.status(500).json({
          message: "Something went wrong.Please try again later.",
          success: false,
        });
      }
    } else {
      if (error instanceof Error) {
        res.status(500).json({
          message:
            error.message ||
            "Something went wrong while updating the lesson order.",
          success: false,
        });
      }
    }
  }
}

export async function updateSectionDetails(
  req: RequestWithUserId,
  res: Response
) {
  const { sectionId, courseId } = req.params;
  const { userId } = req;
  const { title, description } = req.body;

  if (!sectionId || !title) {
    res.status(400).json({
      message: "Section ID and title are required.",
      success: false,
    });
    return;
  }

  try {
    const section = await db.section.findUnique({
      where: { id: sectionId },
      select: {
        course: { select: { instructorId: true, id: true } },
      },
    });

    if (!section) {
      res.status(404).json({
        message: "Section not found.",
        success: false,
      });
      return;
    }

    if (
      section.course.instructorId !== userId ||
      section.course.id !== courseId
    ) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    const updatedSection = await db.section.update({
      where: { id: sectionId },
      data: {
        title,
        description,
      },
      select: {
        title: true,
        description: true,
      },
    });

    res.status(200).json({
      message: "Section details updated successfully.",
      success: true,
      data: updatedSection,
    });
  } catch (error) {
    console.error("Error updating section details:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        res.status(500).json({
          message: "Failed to update.Please try again later.",
          success: false,
        });
      } else {
        res.status(500).json({
          message: "Something went wrong.Please try again later.",
          success: false,
        });
      }
    } else {
      if (error instanceof Error) {
        res.status(500).json({
          message:
            error.message ||
            "Something went wrong while updating the lesson order.",
          success: false,
        });
      }
    }
  }
}

export async function publishCourse(req: RequestWithUserId, res: Response) {
  const { courseId } = req.params;
  const { userId } = req;

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
      select: { instructorId: true, published: true },
    });

    if (!course) {
      res.status(404).json({
        message: "Course not found.",
        success: false,
      });
      return;
    }

    if (course.instructorId !== userId) {
      res.status(403).json({
        message: "Forbidden access.",
        success: false,
      });
      return;
    }

    if (course.published) {
      res.status(400).json({
        message: "Course is already published.",
        success: false,
      });
      return;
    }

    const updatedCourse = await db.course.update({
      where: { id: courseId },
      data: { published: true },
      select: {
        title: true,
        description: true,
        published: true,
      },
    });

    res.status(200).json({
      message: "Course published successfully.",
      success: true,
      data: updatedCourse,
    });
  } catch (error) {
    console.error("Error publishing course:", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2034") {
        res.status(500).json({
          message: "Failed to update.Please try again later.",
          success: false,
        });
      } else {
        res.status(500).json({
          message: "Something went wrong.Please try again later.",
          success: false,
        });
      }
    } else {
      if (error instanceof Error) {
        res.status(500).json({
          message:
            error.message ||
            "Something went wrong while updating the lesson order.",
          success: false,
        });
      }
    }
  }
}
