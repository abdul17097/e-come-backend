import mongoose from "mongoose"
const orderSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        },

        products: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Product"
                },

                quantity: Number
            }
        ],
        totalAmount: Number,
        status: {
            type: String,
            enum: ["pending", "shipped", "delivered"],
            default: "pending"
        }
    },
    { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);