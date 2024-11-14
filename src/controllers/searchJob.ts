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


/**
 * Searches for jobs based on the query parameters provided in the request.
 *
 * Utilizes a MongoDB aggregation pipeline to perform a search on the jobs
 * collection. If a country is specified, it will perform a compound search
 * combining the search query and the country. Otherwise, it searches using
 * the search query across specified fields. The results are projected to
 * include relevant job details and sorted by search relevance.
 *
 * @param req - The request object containing query parameters `query` and `country`.
 * @param res - The response object used to return the search results.
 * @param next - The next middleware function in the stack.
 *
 * @returns A JSON response with a list of jobs matching the search criteria,
 * limited to 10 results, sorted by search score.
 *
 * @throws Will pass any errors to the next middleware.
 */
export const searchJobs = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const searchQuery = req.query.query as string;
	const country = req.query.country as string;

	if (!searchQuery || searchQuery.length < 2) {
		res.json([]);
		return;
	}
	const pipeline = [];

	if (country) {
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
									"country",
									"company",
									"category",
								],
								fuzzy: {},
							},
						},
						{
							text: {
								query: country,
								path: "country",
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
					path: ["title", "country", "company"],
					fuzzy: {},
				},
			},
		});
	}
	pipeline.push({
		$project: {
			_id: 0,
			score: { $meta: "searchScore" },
			title: 1,
			category: 1,
			description: 1,
			country: 1,
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

/**
 * Performs an autocomplete search on job titles based on the provided query
 * parameter. If a country is specified, it will perform a compound search
 * combining the search query and the country. Otherwise, it searches using
 * the search query across the job titles. The results are projected to
 * include relevant job details and sorted by search relevance.
 *
 * @param req - The request object containing query parameters `query` and `country`.
 * @param res - The response object used to return the search results.
 * @param next - The next middleware function in the stack.
 *
 * @returns A JSON response with a list of jobs matching the search criteria,
 * limited to 10 results, sorted by search score.
 *
 * @throws Will pass any errors to the next middleware.
 */
export const autocomplete: RequestHandler = async (req, res, next) => {
	const searchQuery = req.query.query as string;
	const country = req.query.country as string;

	const pipeline = [];

	if (country) {
		pipeline.push({
			$search: {
				index: USER_SEARCH_INDEX_NAME,
				compound: {
					must: [
						{
							autocomplete: {
								query: searchQuery,
								path: "title",
								fuzzy: {},
							},
						},
						{
							text: {
								query: country,
								path: "country",
							},
						},
					],
				},
			},
		});
	} else {
		pipeline.push({
			$search: {
				index: USER_AUTOCOMPLETE_INDEX_NAME,
				autocomplete: {
					query: searchQuery,
					path: "title",
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
			country: 1,
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
