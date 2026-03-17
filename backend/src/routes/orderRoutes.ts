import { Router } from "express";
import { createOrderController } from "@/controllers/OrderController";
import { jwtAuth, requireRole } from "@/middleware/authMiddleware";

const router = Router();
const controller = createOrderController();

router.post("/", jwtAuth, controller.createOrder.bind(controller));
router.get("/", jwtAuth, controller.getOrders.bind(controller));
router.get("/:id", jwtAuth, controller.getOrderById.bind(controller));

export default router;
