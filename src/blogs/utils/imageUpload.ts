/** @format */

import { v2 as cloudinary } from "cloudinary";
import express, { Request, Response } from "express";
import multer, { FileFilterCallback } from "multer";

cloudinary.config({
	cloud_name: process.env.CLOUDINARY_CLOUD_NAME || "",
	api_key: process.env.CLOUDINARY_API_KEY || "",
	api_secret: process.env.CLOUDINARY_API_SECRET || "",
});

interface CloudinaryUploadResponse {
	secure_url: string;
	public_id: string;
	folder?: string;
	created_at?: string;
	resource_type?: string;
}

interface UploadedFile {
	path: string;
	mimetype: string;
}

export const uploadImage = async (file: UploadedFile): Promise<string> => {
	try {
		if (!file.mimetype.startsWith("image/")) {
			throw new Error("Invalid file type. Only image files are allowed.");
		}

		const result: CloudinaryUploadResponse =
			await cloudinary.uploader.upload(file.path, {
				folder: "blog_images",
			});

		return result.secure_url;
	} catch (error) {
		console.error("Image upload failed:", error);
		throw new Error("Image upload failed. Please try again later.");
	}
};

export default uploadImage;