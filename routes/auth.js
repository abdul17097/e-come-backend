import { Router } from "express";
import { getProfile, login, logout, signup } from "../controllers/auth.js";
import { authMiddleware } from "../middlewares/authMiddlware.js";

const routes = Router();

routes.post("/signup", signup);
routes.post("/login", login);
routes.get("/me", authMiddleware, getProfile);
routes.delete("/logout", authMiddleware, logout);

export default routes;
