/** @format */
import env from "../utils/validateEnv";
import "dotenv/config";
import mongoose from "mongoose";

// Establishes a connection to the MongoDB database using the URI from environment variables.
// Logs a success message upon successful connection, and logs an error message if the connection fails.
export const connectMongoDB = async (): Promise<void> => {
	try {
		await mongoose.connect(env.MONGO_DATABASE_URI!);
		console.log("Connected to MongoDB (Job Service)");
	} catch (error) {
		console.error("MongoDB connection error:", error);
	}
};
