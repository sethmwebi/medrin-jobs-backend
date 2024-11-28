import express, { RequestHandler } from "express";
import *  as employerController from "../controllers/companyDetails";

const router =express.Router()
router.get("/profile",employerController.getUserProfile as unknown as RequestHandler);
router.put("/update-details",employerController.updateEmployerDetails as unknown as RequestHandler);

export default router