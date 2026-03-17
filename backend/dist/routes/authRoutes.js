"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const AuthController_1 = require("@/controllers/AuthController");
const router = (0, express_1.Router)();
const controller = (0, AuthController_1.createAuthController)();
router.post("/register", controller.register.bind(controller));
router.post("/login", controller.login.bind(controller));
exports.default = router;
//# sourceMappingURL=authRoutes.js.map