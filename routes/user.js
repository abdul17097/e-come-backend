import { Router } from "express";
import { authMiddleware } from "../middlewares/authMiddlware.js";
import { roleMiddleware } from "../middlewares/roleMiddleware.js";
import {
  allUser,
  deleteUser,
  sigleUser,
  updateUser,
} from "../controllers/user.js";

const router = Router();

router.get("/", allUser);
router.get("/:id", sigleUser);
router.put("/:id", updateUser);
router.delete("/:id", deleteUser);

export default router;
