import { Router } from "express";
import { createAuthController } from "@/controllers/AuthController";

const router = Router();
const controller = createAuthController();

router.post("/register", controller.register.bind(controller));
router.post("/login", controller.login.bind(controller));

export default router;
