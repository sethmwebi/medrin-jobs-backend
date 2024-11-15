import "dotenv/config";
import express from "express";
import { Express, Request, Response, NextFunction } from "express";
import morgan from "morgan";
import createHttpError, { isHttpError } from "http-errors";
import env from "./utils/validEnv";
import { PrismaClient } from "@prisma/client";
import { ZodError } from "zod";
import { formatZodError } from "./utils/format-errors";
import passport from "passport";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import authRouter from "./routes/auth";
import auth from "./middlewares/auth";
import cors from "cors";

import "dotenv/config";
import { connectMongoDB } from "./config/database";

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
require("./utils/passport-config.ts");

const app: Express = express();

const port = env.PORT

export const prisma = new PrismaClient({ log: ["query"] });
app.use(validateJob);


app.use("/api/job", jobRoutes);



app.use(express.json());
// app.use(helmet());
// app.use(helmet.crossOriginResourcePolicy({ policy: "cross-origin"}))
// app.use(
//   helmet.hsts({
//     maxAge: 86400,
//     includeSubDomains: true,
//   })
//  )
// app.use(helmet({ noSniff: true}))
app.use(cookieParser());
app.use(passport.initialize());
app.use(morgan("dev"));

// Enable cors for http://localhost:5173
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  }),
);

app.use("/", authRouter);

app.get("/", (req, res) => {
  res.status(200).json({ message: "Welcome home!" });
});
app.get("/protected", auth, (req, res, next) => {
  res.status(200).send("Protected route access granted!");
});



app.use((_, __, next) => {
  next(createHttpError(404, "Endpoint not found"));
});

app.use((error: any, _req: Request, res: Response, _next: NextFunction) => {
  let errorMessage = "An unknown error occurred";
  let statusCode = 500;

  if (error instanceof ZodError) {
    res.status(400).json({ error: formatZodError(error) });
    return;
  }

  if (isHttpError(error)) {
    statusCode = error.status;
    errorMessage = error.message;
  }

	res.status(statusCode).json({ error: errorMessage })
});




/**
 * Finds a search index by name.
 *
 * @param {string} indexName
 * The name of the search index to find.
 *
 * @returns {Promise<import("mongodb").Collection.IndexesInfo | null>}
 * The search index information or null if the index does not exist.
 *
 * @throws If there is an error while fetching the indexes.
 */
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

/**
 * Upserts a search index for user data in MongoDB Atlas.
 *
 * This function checks if a search index with the name specified by
 * USER_SEARCH_INDEX_NAME exists. If it does not exist, it creates a new
 * search index using the MongoDB Atlas Search API, with dynamic mappings.
 *
 * @throws Will throw an error if there is a problem with the network request
 * or if the index creation fails.
 */
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

/**
 * Upserts an autocomplete search index for user data in MongoDB Atlas.
 *
 * This function checks if a search index with the name specified by
 * USER_AUTOCOMPLETE_INDEX_NAME exists. If it does not exist, it creates a new
 * search index using the MongoDB Atlas Search API, with edgeGram tokenization
 * for the `fullName` field.
 *
 * @throws Will throw an error if there is a problem with the network request
 * or if the index creation fails.
 */
export async function upsertAutocompleteIndex() {
	const userAutocompleteIndex = await findIndexByName(
		USER_AUTOCOMPLETE_INDEX_NAME
	);
	if (!userAutocompleteIndex) {
		await request(ATLAS_SEARCH_INDEX_API_URL, {
			data: {
				name: USER_AUTOCOMPLETE_INDEX_NAME,
				database: MONGODB_DATABASE,
				collectionName: MONGODB_COLLECTION,
				mappings: {
					dynamic: false,
					fields: {
						fullName: [
							{
								foldDiacritics: false,
								maxGrams: 7,
								minGrams: 3,
								tokenization: "edgeGram",
								type: "autocomplete",
							},
						],
					},
				},
			},
			dataType: "json",
			contentType: "application/json",
			method: "POST",
			digestAuth: DIGEST_AUTH,
		});
	}
}

upsertAutocompleteIndex();
upsertSearchIndex();
app.use(errorHandler);
connectMongoDB();
(async () => {
	try {
		await prisma.$connect() 
	
		app.listen(port, () => console.log(`Server running on port http://127.0.0.1:${port}`));
	} catch (error) {
		console.error("Error connecting to Prisma:", error);
		process.exit(1);
	} finally {
		await prisma.$disconnect();
	}
})();
