import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });

// Function to upload an image to Cloudinary
export const uploadImage = async (file: Express.Multer.File) => {
  try {
    const result = await cloudinary.uploader.upload(file.path, {
      folder: 'blog_images',
    });
    return result.secure_url; // Return the URL of the uploaded image
  } catch (error) {
    throw new Error('Image upload failed');
  }
};
