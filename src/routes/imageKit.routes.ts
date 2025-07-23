import { Router } from "express";
import { verifyToken } from "../middleware/auth.middleware.js";
import { getAuthentication } from "../controllers/imagekit.controller.js";

const imageKitRouter = Router();

imageKitRouter.get("/imagekit-auth", verifyToken, getAuthentication);

export default imageKitRouter;
