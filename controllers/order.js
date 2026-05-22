import { Order } from "../models/order.js";
import { Cart } from "../models/cart.js";
import { Product } from "../models/product.js";

export const placeOrder = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "title price stock"
    );

    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Your cart is empty. Add items before placing an order.",
      });
    }

    for (const item of cart.items) {
      if (!item.product) {
        return res.status(400).json({
          success: false,
          message: "One or more products in your cart are no longer available.",
        });
      }
      if (item.product.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for "${item.product.title}". Available: ${item.product.stock}.`,
        });
      }
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.product.price * item.quantity,
      0
    );

    const order = await Order.create({
      user: req.user._id,
      products: cart.items.map((item) => ({
        product:  item.product._id,
        quantity: item.quantity,
      })),
      totalAmount: parseFloat(totalAmount.toFixed(2)),
      status: "pending",
    });

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.product._id, {
        $inc: { stock: -item.quantity },
      });
    }

    await Cart.findOneAndDelete({ user: req.user._id });

    await order.populate("products.product", "title price image");

    return res.status(201).json({
      success: true,
      message: "Order placed successfully.",
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .populate("products.product", "title price image")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      message: "Orders fetched successfully.",
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getSingleOrder = async (req, res) => {
  try {
    const order = await Order.findById(req.params.id).populate(
      "products.product",
      "title price image"
    );

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    const isOwner  = order.user.toString() === req.user._id.toString();
    const isAdmin  = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ success: false, message: "Access denied." });
    }

    return res.status(200).json({ success: true, order });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getAllOrders = async (req, res) => {
  try {
    const { status, page = 1, limit = 20 } = req.query;

    const filter = {};
    if (status) filter.status = status;

    const skip  = (Number(page) - 1) * Number(limit);
    const total = await Order.countDocuments(filter);

    const orders = await Order.find(filter)
      .populate("user",              "name email")
      .populate("products.product", "title price image")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit));

    return res.status(200).json({
      success: true,
      message: "All orders fetched successfully.",
      total,
      page:       Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      orders,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const allowedStatuses = ["pending", "shipped", "delivered"];

    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${allowedStatuses.join(", ")}.`,
      });
    }

    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).populate("products.product", "title price image");

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found." });
    }

    return res.status(200).json({
      success: true,
      message: `Order status updated to "${status}".`,
      order,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
