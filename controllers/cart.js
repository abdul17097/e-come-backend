import mongoose from "mongoose";
import { Cart } from "../models/cart.js";
import { Product } from "../models/product.js";

export const allCartProduct = async (req, res) => {
  try {
    const user = req.user;
    const products = await Cart.aggregate([
      { $match: { user: new mongoose.Types.ObjectId(user._id) } },
      {
        $lookup: {
          from: "products",
          localField: "items.product",
          foreignField: "_id",
          as: "productDetails",
        },
      },
    ]);

    if (products.length === 0) {
      return res.status(404).json({
        message: "Prodcut Not Availabe in Cart",
        success: false,
      });
    }

    res.status(200).json({
      message: "All Cart Product",
      success: true,
      data: products,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCartProduct = async (req, res) => {
  try {
    const user = req.user;
    const cart = await Cart.findOneAndDelete({ user: user._id });

    if (!cart) {
      return res.status(404).json({
        message: "Cart Not Found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Cart Cleared Successfully!",
      success: true,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
export const addToCartProduct = async (req, res) => {
  try {
    const user = req.user;
    const { productId, quantity } = req.body;

    // 1. Ensure parsed quantity is a valid integer
    const requestedQuantity = parseInt(quantity, 10) || 1;

    // 2. Fetch the product directly to check stock
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // 3. Find if the user already has a cart
    let cart = await Cart.findOne({ user: user._id });

    if (!cart) {
      // Scenario A: User doesn't have a cart yet -> Create a new one
      if (product.stock < requestedQuantity) {
        return res
          .status(400)
          .json({ success: false, message: "Insufficient stock" });
      }

      cart = await Cart.create({
        user: user._id,
        items: [{ product: productId, quantity: requestedQuantity }],
      });
    } else {
      // Scenario B: User already has a cart -> Check if item is already in it
      const itemIndex = cart.items.findIndex(
        (item) => item.product.toString() === productId,
      );

      if (itemIndex > -1) {
        // Product exists in cart -> Calculate total pending quantity
        const totalNewQuantity =
          cart.items[itemIndex].quantity + requestedQuantity;

        if (product.stock < totalNewQuantity) {
          return res.status(400).json({
            success: false,
            message: `Cannot add more. Only ${product.stock} items available in stock total.`,
          });
        }

        // Update existing item quantity
        cart.items[itemIndex].quantity = totalNewQuantity;
      } else {
        // Product doesn't exist in cart -> Push it as a new item
        if (product.stock < requestedQuantity) {
          return res
            .status(400)
            .json({ success: false, message: "Insufficient stock" });
        }

        cart.items.push({ product: productId, quantity: requestedQuantity });
      }

      // Save updated cart document
      await cart.save();
    }

    return res.status(200).json({
      message: "Product added to cart successfully",
      success: true,
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const deleteCartProduct = async (req, res) => {
  try {
    const user = req.user;
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: user._id });
    if (!cart) {
      return res.status(404).json({
        message: "Cart not found",
        success: false,
      });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (!item) {
      return res.status(404).json({
        message: "Product not found in cart",
        success: false,
      });
    }

    cart.items = cart.items.filter(
      (item) => item.product.toString() !== productId,
    );

    await cart.save();

    res.status(200).json({
      message: "Product removed from cart successfully",
      success: true,
      data: cart,
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "title price image stock",
    );

    if (!cart) {
      return res.status(200).json({
        success: true,
        message: "Cart is empty.",
        cart: { items: [], totalPrice: 0 },
      });
    }

    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Cart fetched successfully.",
      cart,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const addToCart = async (req, res) => {
  try {
    const { productId, quantity = 1 } = req.body;

    if (!productId) {
      return res
        .status(400)
        .json({ success: false, message: "Product ID is required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock." });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (existingItem) {
      existingItem.quantity += Number(quantity);
    } else {
      cart.items.push({ product: productId, quantity: Number(quantity) });
    }

    await cart.save();
    await cart.populate("items.product", "title price image stock");

    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Product added to cart.",
      cart,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const updateCartItem = async (req, res) => {
  try {
    const { productId } = req.params;
    const { quantity } = req.body;

    if (!quantity || quantity < 1) {
      return res
        .status(400)
        .json({ success: false, message: "Quantity must be at least 1." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found." });
    }

    if (product.stock < quantity) {
      return res
        .status(400)
        .json({ success: false, message: "Insufficient stock." });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId,
    );

    if (!item) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart." });
    }

    item.quantity = Number(quantity);
    await cart.save();
    await cart.populate("items.product", "title price image stock");

    const totalPrice = cart.items.reduce((sum, i) => {
      return sum + (i.product?.price || 0) * i.quantity;
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Cart updated.",
      cart,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const removeFromCart = async (req, res) => {
  try {
    const { productId } = req.params;

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId,
    );

    if (itemIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not found in cart." });
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();
    await cart.populate("items.product", "title price image stock");

    const totalPrice = cart.items.reduce((sum, item) => {
      return sum + (item.product?.price || 0) * item.quantity;
    }, 0);

    return res.status(200).json({
      success: true,
      message: "Item removed from cart.",
      cart,
      totalPrice: parseFloat(totalPrice.toFixed(2)),
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};

export const clearCart = async (req, res) => {
  try {
    const cart = await Cart.findOneAndDelete({ user: req.user._id });

    if (!cart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
