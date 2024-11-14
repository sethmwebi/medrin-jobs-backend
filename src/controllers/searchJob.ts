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
