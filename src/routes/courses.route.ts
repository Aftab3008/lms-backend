import { Router } from "express";
import {
  getAllCourses,
  getCategories,
  getCourseById,
  getFeaturedCourses,
} from "../controllers/courses.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const coursesRouter = Router();

coursesRouter.get("/categories", verifyToken, getCategories);
coursesRouter.get("/all-courses", getAllCourses);
coursesRouter.get("/featured-courses", getFeaturedCourses);
coursesRouter.get("/course/:courseId", verifyToken, getCourseById);

export default coursesRouter;
