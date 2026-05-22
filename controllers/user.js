import bcrypt from "bcryptjs";
import { User } from "../models/user.js";

export const getUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, message: "User fetched successfully.", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const allUser = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip  = (Number(page) - 1) * Number(limit);
    const total = await User.countDocuments();

    const users = await User.find()
      .select("-password")
      .skip(skip)
      .limit(Number(limit))
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Users fetched successfully.",
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      users,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const sigleUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, message: "User fetched successfully.", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    const updateData = {};
    if (name)     updateData.name  = name;
    if (email)    updateData.email = email;
    if (password) updateData.password = await bcrypt.hash(password, 10);

    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    return res.status(200).json({ success: true, message: "User updated successfully.", user });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }
    return res.status(200).json({ success: true, message: "User deleted successfully." });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
