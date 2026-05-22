import { cloudinary } from "../config/cloudinary.js";

export const uploadCloudinary = async (buffer) => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream((error, result) => {
      if (error) {
        reject(error);
      } else {
        resolve(result);
      }
    });
    stream.end(buffer);
  });
};
