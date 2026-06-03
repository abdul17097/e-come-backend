import { Router } from "express";
import {
  addProduct,
  allProducts,
  allProductsForAdmin,
  deleteProduct,
  getSingleProduct,
  updateProduct,
  userReview,
} from "../controllers/product.js";
import uploadMulter from "../config/multer.js";
import { authMiddleware } from "../middlewares/authMiddlware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";

const router = Router();

// router.get("/", getAllProducts);
router.post("/", authMiddleware, roleMiddleware, uploadMulter, addProduct);
router.put(
  "/:productId",
  authMiddleware,
  roleMiddleware,
  uploadMulter,
  updateProduct,
);

router.get("/", allProducts);
router.get("/admin", authMiddleware, roleMiddleware, allProductsForAdmin);

router.post("/review/:productId", authMiddleware, userReview);

// router.put("/:id", authMiddleware, roleMiddleware, uploadMulter, updateProduct);
router.delete("/:productId", authMiddleware, roleMiddleware, deleteProduct);

// router.post("/:id/review", authMiddleware, addReview);

router.get("/:id", getSingleProduct);

export default router;
