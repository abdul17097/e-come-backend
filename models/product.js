import mongoose from "mongoose";
const productSchema = new mongoose.Schema({
    title: String,

    description: String,

    price: Number,

    category: String,

    stock: Number,

    rating: {
        type: Number,
        default: 0
    },

    image: String,

    reviews: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },

            comment: String,

            rating: Number
        }
    ]
},
    { timestamps: true }
);


export const Product = mongoose.model("Product", productSchema);

