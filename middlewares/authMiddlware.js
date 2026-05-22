import jwt from "jsonwebtoken";
import { User } from "../models/user.js";

export const authMiddleware = async (req, res, next) => {
  try {
    const token = req?.cookies.token;

    // const token = req?.headers?.authorization?.split(" ")[1];

    if (!token) {
      throw new Error("Unauthorized");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
      throw new Error("Invalid token");
    }

    const findUser = await User.findById(decodedToken._id);

    if (!findUser) {
      throw new Error("User not found");
    }
    req.user = findUser;
    next();
  } catch (error) {
    throw new Error(error);
  }
};
