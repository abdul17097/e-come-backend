import { Cart } from "../models/cart.js";
import { Product } from "../models/product.js";

export const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user._id }).populate(
      "items.product",
      "title price image stock"
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
      return res.status(400).json({ success: false, message: "Product ID is required." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock." });
    }

    let cart = await Cart.findOne({ user: req.user._id });

    if (!cart) {
      cart = new Cart({ user: req.user._id, items: [] });
    }

    const existingItem = cart.items.find(
      (item) => item.product.toString() === productId
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
      return res.status(400).json({ success: false, message: "Quantity must be at least 1." });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found." });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ success: false, message: "Insufficient stock." });
    }

    const cart = await Cart.findOne({ user: req.user._id });
    if (!cart) {
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const item = cart.items.find(
      (item) => item.product.toString() === productId
    );

    if (!item) {
      return res.status(404).json({ success: false, message: "Item not in cart." });
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
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.product.toString() === productId
    );

    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: "Item not found in cart." });
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
      return res.status(404).json({ success: false, message: "Cart not found." });
    }

    return res.status(200).json({
      success: true,
      message: "Cart cleared successfully.",
    });
  } catch (error) {
    return res.status(500).json({ success: false, message: error.message });
  }
};
