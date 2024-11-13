/** @format */
import env from "../utils/validateEnv";
import "dotenv/config";
import mongoose from "mongoose";

export const connectMongoDB = async (): Promise<void> => {
	try {
		await mongoose.connect(env.MONGO_DATABASE_URI!);
		console.log("Connected to MongoDB (Job Service)");
	} catch (error) {
		console.error("MongoDB connection error:", error);
	}
};
