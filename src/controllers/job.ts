/** @format */
// CRUD Operations for jobs

import { RequestHandler } from "express";
import JobModel from "../models/job";
import { Job } from "../types/interfaces";
import mongoose, { Mongoose } from "mongoose";
import createHttpError from "http-errors";
import { HttpClientRequestError } from "urllib";

export const getJob: RequestHandler = async (req, res, next) => {
	try {
		const jobs = await JobModel.find().exec();
		res.status(200).json(jobs);
	} catch (error) {
		next(error);
	}
};

export const createJob: RequestHandler<unknown, unknown, Job, unknown> = async (
	req,
	res,
	next
) => {
	if (
		!req.body.title ||
		!req.body.description ||
		!req.body.country ||
		!req.body.salary ||
		!req.body.company ||
		!req.body.email ||
		!req.body.contact
	) {
		throw createHttpError(400, "All fields are required");
	}
	if (req.body.salary < 0) {
		throw createHttpError(400, "Salary cannot be negative");
	}
	if (req.body.contact < 0) {
		throw createHttpError(400, "Contact cannot be negative");
	}
	if (
		await JobModel.exists({
			title: req.body.title,
			company: req.body.company,
			email: req.body.email,
			contact: req.body.contact,
			country: req.body.country,
			salary: req.body.salary,
			category: req.body.category,
			description: req.body.description,
			
		})
	) {
		throw createHttpError(400, "Job already exists");
	}

	try {
		const job = await JobModel.create(req.body);
		res.status(201).json(job);
	} catch (error) {
		next(error);
	}
};

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

export const bulkPostJobs: RequestHandler = async (req, res, next) => {
	try {
		const jobs = await JobModel.insertMany(req.body);
		res.status(201).json(jobs);
	} catch (error) {
		next(error);
	}
};
