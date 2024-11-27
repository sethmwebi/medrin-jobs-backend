/** @format */
// CRUD Operations for jobs
import jwt from "jsonwebtoken";
import { RequestHandler } from "express";
import JobModel from "../models/job";
import { Job } from "../types/interfaces";
import mongoose from "mongoose";
import createHttpError from "http-errors";
import { prisma } from "..";

/**
 * Handles GET /api/job requests.
 *
 * Retrieves all jobs from the database and returns them in the response.
 *
 */
export const getJob: RequestHandler = async (req, res, next) => {
	try {
		const jobs = await JobModel.find().exec();
		res.status(200).json(jobs);
	} catch (error) {
		next(error);
	}
};

/**
 * Handles POST /api/job requests.
 *
 * Creates a new job with the provided data.
 *

 */
export const postJob: RequestHandler<unknown, unknown, Job, unknown> = async (
	req,
	res,
	next
) => {
	try {
		if (!req.body.employmentType) {
			throw createHttpError(400, "employment type is required");
		}
		if (!req.body.title) {
			throw createHttpError(400, "Title is required");
		}
		if (!req.body.description) {
			throw createHttpError(400, "Description is required");
		}
		if (!req.body.category) {
			throw createHttpError(400, "Category is required");
		}
		if (!req.body.location) {
			throw createHttpError(400, "Location is required");
		}


		if (!req.body.requirements) {
			throw createHttpError(400, "Requirements are required");
		}
if (!req.body.salaryRange) {
	throw createHttpError(400, "Salary range is required");
}


if (req.body.salaryRange.min > req.body.salaryRange.max) {
	throw createHttpError(400, "Minimum salary cannot be greater than maximum salary");
}

		const token = req.header("Authorization")?.replace("Bearer ", "");
		if (!token) {
			throw createHttpError(401, "Authorization token required");
		}

		// Decode the token and extract the user ID
		const decoded = jwt.decode(token);
		if (!decoded || typeof decoded !== "object" || !decoded.id) {
			throw createHttpError(401, "Invalid or missing user ID in token");
		}
		const id = decoded.id;

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) throw new Error("User not found.Please Log in");

		if (user.jobPostQuota === 0) {
			throw new Error(
				"Job post quota exceeded. Upgrade your subscription or pay for additional posts."
			);
		}
		const job = await JobModel.create({ ...req.body, user_id: id });
		await prisma.user.update({
			where: { id },
			data: { jobPostQuota: user.jobPostQuota - 1 },
		});
		res.status(201).json(job);
	} catch (error: any) {
		console.error(error);
		res.status(500).json({ error: error.message });
		console.log(req.body);
	}
};

/**
 * Handles GET /api/job/:id requests.
 *
 * Retrieves a single job by ID from the database and returns it in the response.
 *

 */
export const getJobById: RequestHandler = async (req, res, next) => {
	const { id } = req.params;
	try {
		if (!mongoose.isValidObjectId(id)) {
			throw createHttpError(400, "Invalid job id");
		}
		const job = await JobModel.findById(id).exec();
		if (!job) {
			throw createHttpError(404, "Job not found");
		}
		res.status(200).json(job);
	} catch (error) {
		next(error);
	}
};

/**
 * Handles DELETE /api/job/:id requests.
 *
 * Deletes a single job by ID from the database.
 *
 */
export const deleteJobById: RequestHandler = async (req, res, next) => {
	const { id } = req.params;
	try {
		if (!mongoose.isValidObjectId(id)) {
			throw createHttpError(400, "Invalid job id");
		}
		const job = await JobModel.findByIdAndDelete(id).exec();
		if (!job) {
			throw createHttpError(404, "Job not found");
		}
		res.status(200).json(job);
	} catch (error) {
		next(error);
	}
};

/**
 * Handles PATCH /api/job/:id requests.
 *
 * Updates a job by ID with the data provided in the request body.
 * Validates the job ID and ensures it is a valid MongoDB ObjectId.
 * If the job is successfully updated, it returns the updated job in the response.
 *

 */
export const updateJobById: RequestHandler = async (req, res, next) => {
	const { id } = req.params;
	try {
		if (!mongoose.isValidObjectId(id)) {
			throw createHttpError(400, "Invalid job id");
		}
		const job = await JobModel.findByIdAndUpdate(id, req.body, {
			new: true,
		}).exec();
		if (!job) {
			throw createHttpError(404, "Job not found");
		}
		res.status(200).json(job);
	} catch (error) {
		next(error);
	}
};

/**
 * Handles POST /api/job/postBulk requests.
 *
 * Inserts multiple jobs into the database based on the array of job data
 * provided in the request body. If the insertion is successful, it returns
 * the inserted jobs in the response with a status code of 201.
 *
 */
export const bulkPostJobs: RequestHandler = async (req, res, next) => {
	try {
		const jobs = await JobModel.insertMany(req.body);
		res.status(201).json(jobs);
	} catch (error) {
		next(error);
	}
};
