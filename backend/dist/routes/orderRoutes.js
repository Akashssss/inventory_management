"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const OrderController_1 = require("@/controllers/OrderController");
const authMiddleware_1 = require("@/middleware/authMiddleware");
const router = (0, express_1.Router)();
const controller = (0, OrderController_1.createOrderController)();
router.post("/", authMiddleware_1.jwtAuth, controller.createOrder.bind(controller));
router.get("/", authMiddleware_1.jwtAuth, controller.getOrders.bind(controller));
router.get("/:id", authMiddleware_1.jwtAuth, controller.getOrderById.bind(controller));
exports.default = router;
//# sourceMappingURL=orderRoutes.js.map