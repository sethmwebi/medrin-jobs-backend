/** @format */
import { InferSchemaType, model, Schema } from "mongoose";

const jobSchema = new Schema({
	title: {
		type: String,
		required: true,
	},
	description: {
		type: String,
		required: true,

	},
	category: {
		type: String,
		required: true,
	},
	location: {
		type: String,
		required: true,
	},
	salary: {
		type: Number,
		required: true,
	},
	company: {
		type: String,
		required: true,
	},
	email: {
		type: String,
		required: true,
	},
	contact: {
		type: String,
		required: true,
	},
	createdAt: {
		type: Date,
		default: Date.now,
	},
});

type Job = InferSchemaType<typeof jobSchema>;

export default model<Job>("Job", jobSchema); 
