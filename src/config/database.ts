/** @format */
import env from "../utils/validateEnv";
import "dotenv/config";
import mongoose from "mongoose";

export const connectMongoDB = async (): Promise<void> => {
	const mongoUri = env.MONGO_DATABASE_URI;

	if (!mongoUri) {
		console.error("MongoDB URI is not defined in environment variables.");
		return;
	}

	try {
		await mongoose.connect(mongoUri, {
			retryWrites: true, // Enable automatic retries on write operations
			maxPoolSize: 10, // Configure the maximum size of the connection pool
			socketTimeoutMS: 45000,
			connectTimeoutMS: 30000,
		});

		console.log("Connected to MongoDB (Job Service)");

		mongoose.connection.on("disconnected", () => {
			console.log("MongoDB disconnected, attempting to reconnect...");
		});

		mongoose.connection.on("reconnected", () => {
			console.log("MongoDB reconnected");
		});

		mongoose.connection.on("error", (err) => {
			console.error("MongoDB connection error:", err);
		});
	} catch (error) {
		console.error("MongoDB connection error:", error);
	}
};
