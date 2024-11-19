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
		if (!req.body.workPlace_type) {
			throw createHttpError(400, "Work place type is required");
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
		if (!req.body.company) {
			throw createHttpError(400, "Company is required");
		}
		if (!req.body.email) {
			throw createHttpError(400, "Email is required");
		}
		if (!req.body.contact) {
			throw createHttpError(400, "Contact is required");
		}
		if (!req.body.workTime) {
			throw createHttpError(400, "Work time is required");
		}
		if (req.body.salary < 0) {
			throw createHttpError(400, "Salary cannot be negative");
		}
		if (
			await JobModel.exists({
				title: req.body.title,
				company: req.body.company,
				email: req.body.email,
				contact: req.body.contact,
				location: req.body.location,
				salary: req.body.salary,
				category: req.body.category,
				description: req.body.description,
				workPlace_type: req.body.workPlace_type,
				workTime: req.body.workTime,
			})
		) {
			throw createHttpError(400, "Job already exists");
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

		if (user.jobPostQuota <= 0) {
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
