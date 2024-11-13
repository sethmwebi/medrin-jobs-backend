/** @format */

import { NextFunction, Request, RequestHandler, Response } from "express";
import JobModel from "../models/job";
import {
	MONGODB_COLLECTION,
	MONGODB_DATABASE,
	upsertSearchIndex,
	USER_AUTOCOMPLETE_INDEX_NAME,
	USER_SEARCH_INDEX_NAME,
} from "..";
import job from "../models/job";

export const searchJobs = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const searchQuery = req.query.query as string;
	const location = req.query.location as string;

	if (!searchQuery || searchQuery.length < 2) {
		res.json([]);
		return;
	}
	const pipeline = [];

	if (location) {
		pipeline.push({
			$search: {
				index: USER_SEARCH_INDEX_NAME,
				compound: {
					must: [
						{
							text: {
								query: searchQuery,
								path: [
									"title",
									"description",
									"location",
									"company",
								],
								fuzzy: {},
							},
						},
						{
							text: {
								query: location,
								path: "location",
							},
						},
					],
				},
			},
		});
	} else {
		pipeline.push({
			$search: {
				index: USER_SEARCH_INDEX_NAME,
				text: {
					query: searchQuery,
					path: ["title", "description", "location", "company"],
					fuzzy: {},
				},
			},
		});
	}
	pipeline.push({
		$project: {
			_id: 0,
			score: { $meta: "searchScore" },
			description: 1,
			location: 1,
			salary: 1,
			company: 1,
			email: 1,
			contact: 1,
			createdAt: 1,
		},
	});

	const result = await JobModel.aggregate(pipeline)
		.sort({ score: -1 })
		.limit(10);
	res.json(result);
};

export const autocomplete: RequestHandler = async (req, res, next) => {
	const searchQuery = req.query.query as string;
	const location = req.query.location as string;

	const pipeline: any[] = [];

	if (location) {
		pipeline.push({
			$search: {
				index: "USER_SEARCH_INDEX_NAME",
				compound: {
					must: [
						{
							autocomplete: {
								query: searchQuery,
								path: [
									"title",
									"description",
									"location",
									"company",
								],
								fuzzy: {},
							},
						},
						{
							text: {
								query: location,
								path: "location",
							},
						},
					],
				},
			},
		});
	} else {
		pipeline.push({
			$search: {
				index: "USER_AUTOCOMPLETE_INDEX_NAME",
				autocomplete: {
					query: searchQuery,
					path: ["title", "description", "location", "company"],
					tokenOrder: "sequential",
				},
			},
		});
	}

	pipeline.push({
		$project: {
			_id: 0,
			score: { $meta: "searchScore" },
			description: 1,
			location: 1,
			salary: 1,
			company: 1,
			email: 1,
			contact: 1,
			createdAt: 1,
		},
	});

	try {
		const result = await JobModel.aggregate(pipeline)
			.sort({ score: -1 })
			.limit(10);

		res.json(result);
	} catch (err) {
		console.error("Error during autocomplete search:", err);
		next(err);
	}
};
