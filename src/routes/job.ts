/** @format */
import express, { RequestHandler } from "express";
import * as jobController from "../controllers/job";
import * as searchController from "../controllers/searchJob";

const router = express.Router();
router.get("/search", searchController.searchJobs as unknown as RequestHandler);
router.get("/autocomplete", searchController.autocomplete);
router.post("/postBulk", jobController.bulkPostJobs);
router.get("/", jobController.getJob);
router.get("/:id", jobController.getJobById);
router.post("/", jobController.createJob);
router.delete("/:id", jobController.deleteJobById);
router.patch("/:id", jobController.updateJobById);



export default router;