/** @format */
// import env from "./utils/validateEnv";
import "dotenv/config";
import { connectMongoDB } from "./config/database";
import express from "express";
import jobRoutes from "./routes/job";
import { validateJob } from "./middlewares/validateJob";
import { errorHandler } from "./middlewares/errorHandler";
import { Collection } from "mongoose";
import axios from "axios";
import { request } from "urllib";

export const MONGODB_DATABASE = process.env.MONGO_DATABASE;
export const MONGODB_COLLECTION = process.env.MONGO_COLLECTION;
export const ATLAS_BASE_URL = "https://cloud.mongodb.com/api/atlas/v1.0";
export const ATLAS_PROJECT_ID = process.env.MONGO_PROJECT_ID;
export const ATLAS_CLUSTER_NAME = process.env.MONGO_CLUSTER;
export const ATLAS_CLUSTER_API_URL = `${ATLAS_BASE_URL}/groups/${ATLAS_PROJECT_ID}/clusters/${ATLAS_CLUSTER_NAME}`;
export const ATLAS_SEARCH_INDEX_API_URL = `${ATLAS_CLUSTER_API_URL}/fts/indexes/${MONGODB_DATABASE}/${MONGODB_COLLECTION}`;
export const ATLAS_API_PUBLIC_KEY = process.env.MONGO_PUBLIC_KEY;
export const ATLAS_API_PRIVATE_KEY = process.env.MONGO_PRIVATE_KEY;
export const DIGEST_AUTH = `${ATLAS_API_PUBLIC_KEY}:${ATLAS_API_PRIVATE_KEY}`;
export const ATLAS_DATA_API_URL = `https://data.mongodb-api.com/i4huirbguwejgiw/app/endpoint/data/v1/action/aggregate`;
export const USER_SEARCH_INDEX_NAME = "location-search";
export const USER_AUTOCOMPLETE_INDEX_NAME = "location_autocomplete";


export const app = express();
app.use(validateJob);
app.use(express.json());

app.use("/api/job", jobRoutes);
app.use(errorHandler);

const port = process.env.PORT;

export async function findIndexByName(indexName: string) {
	try {
		const allIndexesResponse = await request(
			`${ATLAS_SEARCH_INDEX_API_URL}`,
			{
				dataType: "json",
				contentType: "application/json",
				method: "GET",
				digestAuth: DIGEST_AUTH,
			}
		);
		console.log("Indexes Response:", allIndexesResponse.data);
		if (Array.isArray(allIndexesResponse.data)) {
			return allIndexesResponse.data.find((i) => i.name === indexName);
		} else {
			console.error(
				"Expected an array but got:",
				allIndexesResponse.data
			);
			return null;
		}
	} catch (error) {
		console.error("Error fetching indexes:", error);
		throw error;
	}
}

export async function upsertSearchIndex() {
	const userSearchIndex = await findIndexByName(USER_SEARCH_INDEX_NAME);
	if (!userSearchIndex) {
		await request(ATLAS_SEARCH_INDEX_API_URL, {
			data: {
				name: USER_SEARCH_INDEX_NAME,
				database: MONGODB_DATABASE,
				collectionName: MONGODB_COLLECTION,
				mappings: {
					dynamic: true,
				},
			},
			dataType: "json",
			contentType: "application/json",
			method: "POST",
			digestAuth: DIGEST_AUTH,
		});
	}
}

export async function upsertAutoCompleteIndex() {
	try {
		const response = await axios({
			url: ATLAS_SEARCH_INDEX_API_URL,
			method: "POST",
			auth: {
				username: process.env.ATLAS_API_PUBLIC_KEY as string,
				password: process.env.ATLAS_API_PRIVATE_KEY as string,
			},
			data: {
				database: process.env.MONGO_DATABASE,
				collectionName: process.env.MONGO_COLLECTION,
				name: "location-search",
				mappings: {
					dynamic: true,
				},
			},
			headers: {
				"Content-Type": "application/json",
			},
		});
		console.log("Search index upserted successfully:", response.data);
	} catch (error) {
		console.error("Error upserting search index:", error);
	}
}
upsertSearchIndex();

connectMongoDB();
app.listen(port, () => {
	console.log(`Example app listening at http://127.0.0.1:${port}`);
});
