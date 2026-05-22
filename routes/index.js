import { Router } from "express";
import authRoutes from "./auth.js";
import userRoutes from "./user.js";
import { authMiddleware } from "../middlewares/authMiddlware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import productRoutes from "../routes/product.js";

import cartRoutes from "./cart.js";
import orderRoutes from "./order.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/user", authMiddleware, roleMiddleware, userRoutes);
router.use("/products", productRoutes);
router.use("/cart", cartRoutes);
router.use("/orders", orderRoutes);

export default router;
