"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const UserController_1 = require("@/controllers/UserController");
const authMiddleware_1 = require("@/middleware/authMiddleware");
const router = (0, express_1.Router)();
const userController = (0, UserController_1.createUserController)();
// Admin: Search users
router.get("/search", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.searchUsers(req, res, next));
router.post("/search", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.searchUsers(req, res, next));
// Admin: List all users
router.get("/", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.listUsers(req, res, next));
// Admin: Create user
router.post("/", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.createUser(req, res, next));
// Admin: Get specific user
router.get("/:id", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.getUser(req, res, next));
// Admin: Update user (role, name, password, isActive)
router.put("/:id", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.updateUser(req, res, next));
// Admin: Delete user
router.delete("/:id", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), (req, res, next) => userController.deleteUser(req, res, next));
// Authenticated: Update own profile
router.put("/me/profile", authMiddleware_1.jwtAuth, (req, res, next) => userController.updateProfile(req, res, next));
// Authenticated: Change own password
router.post("/me/change-password", authMiddleware_1.jwtAuth, (req, res, next) => userController.changePassword(req, res, next));
exports.default = router;
//# sourceMappingURL=userRoutes.js.map