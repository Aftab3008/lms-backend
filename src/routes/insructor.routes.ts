import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { validateBody } from "../middleware/validateBody.middleware.js";
import {
  addLessonToSection,
  createCategory,
  createCourse,
  createSection,
  deleteLessonInSection,
  deleteSection,
  getCourseByIdInstructor,
  getCoursesByInstructor,
  publishCourse,
  updateCourseDetails,
  updateCourseSettings,
  updateLessonOrder,
  updateSectionDetails,
  updateSectionOrder,
} from "../controllers/instructor.controller.js";
import {
  courseDetailsSchema,
  courseFormSchema,
  createCategorySchema,
  lessonSchema,
  sectionSchema,
  updateSettingsSchema,
} from "../schema/course.schema.js";

const instructorRouter = Router();

instructorRouter.get("/courses", verifyToken, getCoursesByInstructor);

instructorRouter.post(
  "/courses/create",
  verifyToken,
  validateBody(courseFormSchema),
  createCourse
);
instructorRouter.post(
  "/create-category",
  verifyToken,
  validateBody(createCategorySchema),
  createCategory
);
instructorRouter.get(
  "/course-instructor/:courseId",
  verifyToken,
  getCourseByIdInstructor
);
instructorRouter.post(
  "/courses/:courseId/sections/create",
  verifyToken,
  validateBody(sectionSchema),
  createSection
);
instructorRouter.post(
  "/courses/:courseId/sections/:sectionId/lessons/create",
  verifyToken,
  validateBody(lessonSchema),
  addLessonToSection
);
instructorRouter.delete(
  "/courses/:courseId/sections/:sectionId/lessons/:lessonId/delete",
  verifyToken,
  deleteLessonInSection
);
instructorRouter.patch(
  "/courses/:courseId/sections/order/update",
  verifyToken,
  updateSectionOrder
);
instructorRouter.patch(
  "/courses/:courseId/sections/:sectionId/lessons/order/update",
  verifyToken,
  updateLessonOrder
);
instructorRouter.patch(
  "/courses/:courseId/details/update",
  verifyToken,
  validateBody(courseDetailsSchema),
  updateCourseDetails
);
instructorRouter.patch(
  "/courses/:courseId/settings/update",
  verifyToken,
  validateBody(updateSettingsSchema),
  updateCourseSettings
);
instructorRouter.delete(
  "/courses/:courseId/sections/:sectionId/delete",
  verifyToken,
  deleteSection
);
instructorRouter.patch(
  "/courses/:courseId/sections/:sectionId/update",
  verifyToken,
  validateBody(sectionSchema),
  updateSectionDetails
);
instructorRouter.patch(
  "/courses/:courseId/publish",
  verifyToken,
  publishCourse
);

export default instructorRouter;
