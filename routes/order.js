import { Router } from "express";
import {
  placeOrder,
  getMyOrders,
  getSingleOrder,
  getAllOrders,
  updateOrderStatus,
} from "../controllers/order.js";
import { authMiddleware } from "../middlewares/authMiddlware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

router.post("/",              authMiddleware,                       placeOrder);
router.get("/my-orders",      authMiddleware,                       getMyOrders);
router.get("/:id",            authMiddleware,                       getSingleOrder);

router.get("/",               authMiddleware, roleMiddleware,       getAllOrders);
router.patch("/:id/status",   authMiddleware, roleMiddleware,       updateOrderStatus);

export default router;
