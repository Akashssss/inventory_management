import { Router } from "express";
import { createUserController } from "@/controllers/UserController";
import { jwtAuth, requireRole } from "@/middleware/authMiddleware";

const router = Router();
const userController = createUserController();

// Admin: Search users
router.get("/search", jwtAuth, requireRole("admin"), (req, res, next) => userController.searchUsers(req, res, next));
router.post("/search", jwtAuth, requireRole("admin"), (req, res, next) => userController.searchUsers(req, res, next));

// Admin: List all users
router.get("/", jwtAuth, requireRole("admin"), (req, res, next) => userController.listUsers(req, res, next));
// Admin: Create user
router.post("/", jwtAuth, requireRole("admin"), (req, res, next) => userController.createUser(req, res, next));

// Admin: Get specific user
router.get("/:id", jwtAuth, requireRole("admin"), (req, res, next) => userController.getUser(req, res, next));

// Admin: Update user (role, name, password, isActive)
router.put("/:id", jwtAuth, requireRole("admin"), (req, res, next) => userController.updateUser(req, res, next));

// Admin: Delete user
router.delete("/:id", jwtAuth, requireRole("admin"), (req, res, next) => userController.deleteUser(req, res, next));

// Authenticated: Update own profile
router.put("/me/profile", jwtAuth, (req, res, next) => userController.updateProfile(req, res, next));

// Authenticated: Change own password
router.post("/me/change-password", jwtAuth, (req, res, next) => userController.changePassword(req, res, next));

export default router;
