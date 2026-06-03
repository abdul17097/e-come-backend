import { Router } from "express";
import {
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  addToCartProduct,
  deleteCartProduct,
  allCartProduct,
  clearCartProduct,
} from "../controllers/cart.js";
import { authMiddleware } from "../middlewares/authMiddlware.js";

const router = Router();

router.get("/", authMiddleware, getCart);
router.post("/", authMiddleware, addToCartProduct);
router.put("/:productId", authMiddleware, updateCartItem);
router.delete("/:productId", authMiddleware, removeFromCart);
router.delete("/", authMiddleware, clearCart);

export default router;
