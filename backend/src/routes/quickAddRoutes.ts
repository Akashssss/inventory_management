import { Router } from "express";
import { createQuickAddController } from "@/controllers/QuickAddController";
import { jwtAuth, requireRole } from "@/middleware/authMiddleware";

const router = Router();
const controller = createQuickAddController();

router.post("/quick-add", jwtAuth, controller.quickAdd.bind(controller));

// Get quick-add logs - admin/seller
router.get("/logs", jwtAuth, controller.getLogs.bind(controller));

// Reconciliation - admin only
router.post("/reconcile", jwtAuth, requireRole("admin"), controller.reconcile.bind(controller));

export default router;

