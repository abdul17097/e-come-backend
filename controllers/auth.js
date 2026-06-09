import bcrypt from "bcryptjs";
import { User } from "../models/user.js";
import { generateToken } from "../utils/generateToken.js";

// signup controller
export const signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser) {
      throw new Error("User is already exist");
    }

    const hashPassword = await bcrypt.hash(password, 10);
    const createUser = await User.create({
      name,
      email,
      password: hashPassword,
    });
    return res.status(201).json({
      message: "User created successfully",
      success: true,
      data: createUser,
    });
  } catch (error) {
    throw new Error(error);
  }
};

// login controller
export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email });
    if (!findUser) {
      throw new Error("User is not exist");
    }
    const comparePassword = await bcrypt.compare(password, findUser.password);
    if (!comparePassword) {
      throw new Error("Invalid credentials");
    }
    const token = generateToken({ _id: findUser._id, role: findUser.role });
    return res
      .cookie("token", token, {
        httpOnly: true,
        secure:true,
        sameSite: 'none'
      })
      .status(200)
      .json({
        message: "User logged in successfully",
        success: true,
        data: findUser,
      });
  } catch (error) {
    throw new Error(error);
  }
};

// profile
export const getProfile = async (req, res) => {
  try {
    const user = req.user;
    const findUser = await User.findById({ _id: user._id });
    if (!findUser) {
      throw new Error("User Not Found");
    }
    res.status(200).json({
      message: "User Detail",
      success: true,
      data: findUser,
    });
  } catch (error) {
    throw new Error(error);
  }
};

// logout
export const logout = async (req, res) => {
  try {
    // 1. Check if the user is even logged in to begin with
    const token = req.cookies?.token;
    if (!token) {
      return res.status(400).json({
        success: false,
        message: "You are already logged out or no session exists.",
      });
    }

    // 2. Clear the cookie using the exact same options it was created with
    res.clearCookie("token", {
      httpOnly: true,
    });

    // 3. Return clean, consistent success payload
    return res.status(200).json({
      success: true,
      message: "Logged out successfully.",
    });
  } catch (error) {
    throw new Error(error);
  }
};
