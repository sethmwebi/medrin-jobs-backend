/** @format */

import express from "express";
import {
createSubscription
} from "../controllers/payment";

const router = express.Router();

router.post("/create-payment-intent", createSubscription);
export default router;
