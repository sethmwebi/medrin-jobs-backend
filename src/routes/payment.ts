/** @format */

import express, { RequestHandler } from "express";
import {
	createPaymentIntent,
	handlePaymentSuccess,
	createSubscription
} from "../controllers/payment";

const router = express.Router();

router.post("/payment-intent", createPaymentIntent as unknown as RequestHandler);
router.post("/payment-success", handlePaymentSuccess);
router.post("/create-subscription", createSubscription);

export default router;
