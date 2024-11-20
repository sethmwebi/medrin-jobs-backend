/** @format */

import express, { NextFunction, RequestHandler } from "express";
import {
	createPaymentIntent,
	handlePaymentSuccess,
	createSubscription,
	stkPush,
	handleMpesaCallback,
} from "../controllers/payment";

const router = express.Router();

router.post("/payment-intent",createPaymentIntent as unknown as RequestHandler);
router.post("/payment-success", handlePaymentSuccess);
router.post("/create-subscription", createSubscription);
router.post("/cancel-subscription", createSubscription);
router.post("/pay", stkPush as unknown as RequestHandler);
router.post("/callback", handleMpesaCallback as unknown as RequestHandler);

export default router;
