// create | add product

import { Product } from "../models/product.js";
import { uploadCloudinary } from "../utils/uploadCloudinary.js";

export const addProduct = async (req, res) => {
  try {
    const { title, description, price, category, stock } = req.body;
    const image = req.file;

    const result = await uploadCloudinary(req.file.buffer);
    console.log(result);

    const newProduct = await Product.create({
      title,
      description,
      price,
      category,
      stock,
      image: result.secure_url,
    });
    res.status(201).json({
      message: "Product Created Successfully!",
      success: true,
      data: newProduct,
    });
  } catch (error) {
    console.log(error);
    throw new Error(error);
  }
};

export const allProducts = async (req, res) => {
  const { search, category, limit = 10, skip, sort } = req.query;

  try {
    const matchStage = { stock: { $gt: 0 } };

    if (search) {
      matchStage.title = { $regex: search, $options: "i" };
    }
    if (category) {
      matchStage.category = { $regex: category, $options: "i" };
    }

    var sortStage = { createdAt: -1 };

    if (sort === "acen") sortStage = { createdAt: 1 };

    const pipline = [];
    // if(skip){
    //   pipline.push({ $limit: Number(limit) })
    // }

    const totalProduct = await Product.countDocuments();
    const products = await Product.aggregate([
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: Number(skip) || 0 },
      { $limit: Number(limit) || 10 },
    ]);

    // const products = await Product.aggregate([
    //   {
    //     $match: {
    //       $and: [
    //         search
    //           ? {
    //               title: { $regex: search, $options: "i" },
    //             }
    //           : {},
    //         category
    //           ? {
    //               category: { $regex: category, $options: "i" },
    //             }
    //           : {},

    //       ],
    //     },
    //   },
    //   {
    //     $skip: skip,
    //   },
    //   {
    //     $limit: limit,
    //   },
    // ]);
    res.status(200).json({
      success: true,
      data: { products, totalProduct },
    });
  } catch (error) {
    throw new Error(error);
  }
};
export const allProductsForAdmin = async (req, res) => {
  const { search, category, limit = 10, skip, sort } = req.query;
  console.log(search);

  try {
    const matchStage = {};

    if (search) {
      matchStage.title = { $regex: search, $options: "i" };
    }
    if (category) {
      matchStage.category = { $regex: category, $options: "i" };
    }

    var sortStage = { createdAt: -1 };

    if (sort === "acen") sortStage = { createdAt: 1 };

    const pipline = [];
    // if(skip){
    //   pipline.push({ $limit: Number(limit) })
    // }

    const totalProduct = await Product.countDocuments();
    const products = await Product.aggregate([
      { $match: matchStage },
      { $sort: sortStage },
      { $skip: Number(skip) || 0 },
      { $limit: Number(limit) || 10 },
    ]);

    // const products = await Product.aggregate([
    //   {
    //     $match: {
    //       $and: [
    //         search
    //           ? {
    //               title: { $regex: search, $options: "i" },
    //             }
    //           : {},
    //         category
    //           ? {
    //               category: { $regex: category, $options: "i" },
    //             }
    //           : {},

    //       ],
    //     },
    //   },
    //   {
    //     $skip: skip,
    //   },
    //   {
    //     $limit: limit,
    //   },
    // ]);
    res.status(200).json({
      success: true,
      data: { products, totalProduct },
    });
  } catch (error) {
    throw new Error(error);
  }
};

export const updateProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { title, description, price, category, stock } = req.body;

    const image = req.file;

    const isExistProduct = await Product.findById(productId);

    if (!isExistProduct) {
      return res.status(404).json({
        message: "Product Not Found",
        success: false,
      });
    }
    let result;
    if (req.file) {
      result = await uploadCloudinary(req.file.buffer);
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      productId,
      {
        $set: {
          ...req.body,
          image: req.file ? result.secure_url : isExistProduct.image,
        },
      },
      { new: true },
    );

    res.status(201).json({
      data: updateProduct,
      message: "Proudct Updated Successfull",
      success: true,
    });
  } catch (error) {
    console.log(error);

    throw new Error(error);
  }
};

export const userReview = async (req, res) => {
  try {
    const { comment, rating } = req.body;

    // Assuming your route looks like: POST /api/products/:productId/review
    const { productId } = req.params;

    // Assuming your authentication middleware attaches the logged-in user to 'req'
    const userId = req.user._id;

    // 1. Basic validation
    if (!rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Please provide both a rating and a comment",
      });
    }

    // 2. Find the product
    const product = await Product.aggregate([
      { $match: { _id: new mongoose.Types.ObjectId(productId) } },
      {
        $lookup: {
          from: "users",
          localField: "reviews.user",
          foreignField: "_id",
          as: "reviewers",
        },
      },
    ]);

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    // 3. Check if the user has already reviewed this product
    const existingReview = product.reviews.find(
      (rev) => rev.user.toString() === userId.toString(),
    );

    if (existingReview) {
      // If they already reviewed it, update their existing review
      existingReview.comment = comment;
      existingReview.rating = Number(rating);
    } else {
      // If it's a new review, push it to the reviews array
      const newReview = {
        user: userId,
        comment,
        rating: Number(rating),
      };
      product.reviews.push(newReview);
    }
    // const numbers = [3,5,6,7]
    // let sum=0
    // for(let i=0; i<numbers.length; i++){
    //  sum = sum + numbers[i]
    //  }

    // 4. Recalculate the overall product rating
    // Sum up all the ratings in the reviews array
    const sumRatings = product.reviews.reduce(
      (acc, item) => item.rating + acc,
      0,
    );

    // Calculate the average (Total Rating Sum / Number of Reviews)
    product.rating = sumRatings / product.reviews.length;

    // 5. Save the product document
    await product.save();

    res.status(200).json({
      success: true,
      message: existingReview
        ? "Review updated successfully"
        : "Review added successfully",
      data: product,
    });
  } catch (error) {
    console.error("Review Error: ", error);
    res.status(500).json({
      success: false,
      message: error.message || "Failed to submit review",
    });
  }
};

export const getSingleProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }
    res.status(200).json({
      success: true,
      data: product,
    });
  } catch (error) {
    console.error("Get Single Product Error: ", error);
    res.status(500).json({
      success: false,
      message: "Internal Server Error",
    });
  }
};

export const deleteProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const isExistProduct = await Product.findByIdAndDelete(productId);
    if (!isExistProduct) {
      return res.status(404).json({
        message: "Product Not Found",
        success: false,
      });
    }

    res.status(200).json({
      message: "Product Deleted Successfully!",
      success: true,
    });
  } catch (error) {
    throw new Error(error);
  }
};
