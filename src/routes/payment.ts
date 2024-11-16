/** @format */

import express from "express";
import {
	createPaymentIntent,
	handlePaymentSuccess,
	createSubscription
} from "../controllers/payment";

const router = express.Router();

router.post("/create-payment-intent", createPaymentIntent);
router.post("/payment-success", handlePaymentSuccess);
router.post("/create-subscription", createSubscription);

export default router;
