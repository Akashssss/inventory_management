"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const QuickAddController_1 = require("@/controllers/QuickAddController");
const authMiddleware_1 = require("@/middleware/authMiddleware");
const router = (0, express_1.Router)();
const controller = (0, QuickAddController_1.createQuickAddController)();
router.post("/quick-add", authMiddleware_1.jwtAuth, controller.quickAdd.bind(controller));
// Get quick-add logs - admin/seller
router.get("/logs", authMiddleware_1.jwtAuth, controller.getLogs.bind(controller));
// Reconciliation - admin only
router.post("/reconcile", authMiddleware_1.jwtAuth, (0, authMiddleware_1.requireRole)("admin"), controller.reconcile.bind(controller));
exports.default = router;
//# sourceMappingURL=quickAddRoutes.js.map