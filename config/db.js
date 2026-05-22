import mongoose from "mongoose";


export const dbConnection = async () => {

    try {
        await mongoose.connect(process.env.MONGODB_URI)

        console.log("Database connection successful!")

    } catch (error) {
        console.log("error in database connection", error);
        process.exit(1);
    }
}