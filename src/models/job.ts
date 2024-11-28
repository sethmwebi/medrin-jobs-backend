/** @format */
import { count } from "console";
import { application } from "express";
import { InferSchemaType, model, Schema } from "mongoose";
enum JobStatus {
	Draft = "draft",
	Published = "published",
	Expired = "expired",
	Closed = "closed",
}

const jobSchema = new Schema(
	{
		user_id: {
			type: String,
			required: true,
		},
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
		employmentType: {
			type: String,
			required: true,
		},
		company: {
			type: String,
			required: true,
		},
		email: {
			type: String,
			required: true,
			match: [/.+@.+\..+/, "Please provide a valid email address"],
		},
		contact: {
			type: String,
			required: true,
			minlength: [10, "Contact number must be at least 10 digits"],
			maxlength: [15, "Contact number cannot exceed 15 digits"],
		},
		salaryRange: {
			type: {
				min: { type: Number, required: true },
				max: { type: Number, required: true },
			},
			required: true,
		},
		requirements: {
			type: [String],
			required: true,
		},

		applicationDeadline: {
			type: Date,
			required: true,
		},
		applicationInstructions: {
			type: String,
			required: true,
		},
		requiredDocuments: {
			type: [String],
			required: true,
		},
		status: {
			type: String,
			enum: ["draft", "published", "expired", "closed"],
			default: "published",
		},
	},
	{
		timestamps: true,
	}
);

type Job = InferSchemaType<typeof jobSchema>;

export default model<Job>("Job", jobSchema);
