import { Router } from "express";
import {
  getAllCourses,
  getCategories,
  getCourseById,
} from "../controllers/courses.controller.js";
import { verifyToken } from "../middleware/auth.middleware.js";

const coursesRouter = Router();

coursesRouter.get("/categories", verifyToken, getCategories);
coursesRouter.get("/all-courses", verifyToken, getAllCourses);
coursesRouter.get("/course/:courseId", verifyToken, getCourseById);

export default coursesRouter;
