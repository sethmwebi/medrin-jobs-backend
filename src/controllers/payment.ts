/** @format */
import axios from "axios";
import { stripe } from "../config/stripe";
import jwt from "jsonwebtoken";
import { NextFunction, Request, RequestHandler, Response } from "express";
import { prisma } from "..";
import cron from "node-cron";
import createHttpError from "http-errors";
import { stringify } from "flatted";
// Stripe
export const createPaymentIntent = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { amount } = req.body;

	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		if (!token) {
			throw createHttpError(401, "Authorization token required");
		}

		const decoded = jwt.decode(token) as { id?: string };
		console.log("Decoded Token:", decoded);

		if (!decoded || !decoded.id) {
			throw createHttpError(401, "Invalid or missing user ID in token");
		}

		const id = decoded.id;

		if (!id) {
			return res.status(400).json({
				error: `User ID is required here is your body ${req.body} and ${id}`,
			});
		}

		const user = await prisma.user.findUnique({ where: { id: id } });

		if (!user) throw new Error("User not found");

		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100,
			currency: "usd",
			metadata: { userId: id },
		});

		res.status(200).json({
			clientSecret: paymentIntent.client_secret,
			id: paymentIntent.id,
		});
	} catch (error: any) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
};
export const handlePaymentSuccess: RequestHandler = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { paymentIntentId } = req.body;
	try {
		const paymentIntent = await stripe.paymentIntents.retrieve(
			paymentIntentId
		);
		const { userId } = paymentIntent.metadata;

		// Save payment details to the database
		await prisma.payment.create({
			data: {
				user_id: userId,
				amount: paymentIntent.amount,
				payment_method: paymentIntent.payment_method_types[0],
				payment_status: paymentIntent.status,
				transactionId: paymentIntent.id,
			},
		});

		res.status(200).json({
			message: "Payment successful",
		});
	} catch (error) {
		next(error);
	}
};

const getPriceId = (plan: string): string => {
	const priceIds: { [key: string]: string } = {
		Basic: "price_1QLrobB4ye5lKzaRFZjaZrX3",
		Pro: "price_1QLrpTB4ye5lKzaRc0uDnzyh",
		Enterprise: "price_1QLrtcB4ye5lKzaRMfziUjz5",
	};
	return priceIds[plan] || "";
};

export const createSubscription = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { plan } = req.body;

	try {
		const token = req.header("Authorization")?.replace("Bearer ", "");
		if (!token) {
			throw createHttpError(401, "Authorization token required");
		}

		const decoded = jwt.decode(token);
		if (!decoded || typeof decoded !== "object" || !decoded.id) {
			throw createHttpError(401, "Invalid or missing user ID in token");
		}

		const id = decoded.id;

		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) throw new Error("User not found");

		const payment = await prisma.payment.findFirst({
			where: { user_id: id },
		});

		let stripeCustomerId = user.stripeCustomerId;
		if (!stripeCustomerId) {
			const stripeCustomer = await stripe.customers.create({
				email: user.email,
			});
			stripeCustomerId = stripeCustomer.id;

			await prisma.user.update({
				where: { id },
				data: { stripeCustomerId },
			});
		}
		const paymentMethodId = "tok_visa";

		await stripe.paymentMethods.attach(paymentMethodId, {
			customer: stripeCustomerId,
		});

		await stripe.customers.update(stripeCustomerId, {
			invoice_settings: { default_payment_method: paymentMethodId },
		});

		// Get the Stripe price ID for the selected plan ::f(x) for the plan is line 74
		const planPriceId = getPriceId(plan);
		if (!planPriceId) throw new Error("Invalid plan selected");

		const subscription = await stripe.subscriptions.create({
			customer: stripeCustomerId,
			items: [{ price: planPriceId }],
		});

		await prisma.user.update({
			where: { id },
			data: {
				subscriptionPlan: plan,
				subscriptionStartDate: new Date(),
				subscriptionEndDate: new Date(
					new Date().setMonth(new Date().getMonth() + 1)
				), // Subscription end date 1 month from now
				jobPostQuota: getPlanQuota(plan),
			},
		});

		res.status(200).json({
			message: "Subscription created successfully",
			subscription,
		});
	} catch (error: any) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
};

export const cancelSubscription = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { id } = req.params;
		const subscription = await stripe.subscriptions.retrieve(id);
		await stripe.subscriptions.update(id, { cancel_at_period_end: true });
		res.status(200).json({
			message: "Subscription cancelled successfully",
			subscription,
		});
	} catch (error) {
		next(error);
	}
};

//M-PESA

const generateAccessToken = async (): Promise<string> => {
	const consumerKey = process.env.CONSUMER_KEY;
	const consumerSecret = process.env.CONSUMER_SECRET;
	const auth = Buffer.from(`${consumerKey}:${consumerSecret}`).toString(
		"base64"
	);

	const response = await axios.get(
		"https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
		{
			headers: { Authorization: `Basic ${auth}` },
		}
	);
	console.log(response.data.accesstoken);
	return response.data.access_token;
};

export const stkPush = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		const { phoneNumber, plan } = req.body;

		if (!phoneNumber || !plan) {
			return res
				.status(400)
				.json({ error: "Phone number and plan are required." });
		}
		const token = req.header("Authorization")?.replace("Bearer ", "");
		if (!token) {
			throw createHttpError(401, "Authorization token required");
		}

		const decoded = jwt.decode(token) as { id?: string };
		console.log("Decoded Token:", decoded);

		if (!decoded || !decoded.id) {
			throw createHttpError(401, "Invalid or missing user ID in token");
		}

		const userId = decoded.id;

		const accessToken = await generateAccessToken();

		const amount = getPlanPrice(plan, "kes");

		const businessShortCode = process.env.BUSINESS_SHORTCODE;
		const passkey = process.env.PASSKEY;
		const date = new Date();
		const timestamp =
			date.getFullYear() +
			("0" + (date.getMonth() + 1)).slice(-2) +
			("0" + date.getDate()).slice(-2) +
			("0" + date.getHours()).slice(-2) +
			("0" + date.getMinutes()).slice(-2) +
			("0" + date.getSeconds()).slice(-2);
		const password = Buffer.from(
			`${businessShortCode}${passkey}${timestamp}`
		).toString("base64");

		const data = {
			BusinessShortCode: businessShortCode,
			Password: password,
			Timestamp: timestamp,
			TransactionType: "CustomerPayBillOnline",
			Amount: amount,
			PartyA: phoneNumber,
			PartyB: businessShortCode,
			PhoneNumber: phoneNumber,
			CallBackURL:
				"https://medrin-jobs-backend-nn38.onrender.com/subscription/callback",
			AccountReference: "Medrin Jobs",
			TransactionDesc: "Payment for a service",
		};

		const response = await axios.post(
			"https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
			data,
			{
				headers: {
					Authorization: `Bearer ${accessToken}`,
					"Content-Type": "application/json",
				},
			}
		);
		await prisma.user.update({
			where: { id: userId },
			data: {
				mpesaReferenceId: response.data.CheckoutRequestID,
			},
		});
		res.status(200).json(response.data);
	} catch (error: any) {
		console.error(error);
		res.status(500).json({ error: error.message });
	}
};

const subscriptionPrices: { [key: string]: { kes: number; usd: number } } = {
	Basic: { kes: 1, usd: 10 },
	Pro: { kes: 1000, usd: 150 },
	Enterprise: { kes: 2, usd: 1000 },
};

const getPlanPrice = (plan: string, currency: "kes" | "usd"): number => {
	const prices = subscriptionPrices[plan];
	if (!prices) throw new Error("Invalid subscription plan");
	return prices[currency];
};

export const handleMpesaCallback = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	try {
		console.log("handleMpesaCallback called");

		const callbackData = req.body;
		console.log("callMetadata:", callbackData.callbackMetadata);

		if (!callbackData) {
			console.error("No callback data received");
			return res.status(400).json({
				status: "error",
				message: "No callback data received",
			});
		}

		const { stkCallback } = callbackData.Body;
		console.log("STK Callback:", stkCallback);

		if (stkCallback.ResultCode === 0) {
			const metadata = stkCallback.CallbackMetadata.Item;
			console.log("Metadata:", metadata);

			const checkoutDetails = {
				checkoutRequestID: stkCallback.CheckoutRequestID,
		
			};
			const transactionDetails = {
				amount: metadata.find((item: any) => item.Name === "Amount")
					?.Value,
				mpesaReceiptNumber: metadata.find(
					(item: any) => item.Name === "MpesaReceiptNumber"
				)?.Value,
				transactionDate: metadata.find(
					(item: any) => item.Name === "TransactionDate"
				)?.Value,
				phoneNumber: metadata.find(
					(item: any) => item.Name === "PhoneNumber"
				)?.Value,
			};

			console.log("Payment successful:", transactionDetails);

			let plan: string | undefined;
			try {
				// Use the getPlanPrice function to determine the plan
				if (transactionDetails.amount) {
					const amountInKes = transactionDetails.amount; // Assuming the amount is in KES
					for (const planName in subscriptionPrices) {
						if (subscriptionPrices[planName].kes === amountInKes) {
							plan = planName;
							break;
						}
					}
				}

				if (!plan) {
					throw new Error(
						"Invalid payment amount for subscription plan"
					);
				}
			} catch (error) {
				console.error("Error determining subscription plan:", error);
			}

			await prisma.user.update({
				where: { mpesaReferenceId: checkoutDetails.checkoutRequestID },
				data: {
					subscriptionPlan: plan,
					subscriptionStartDate: new Date(),
					subscriptionEndDate: new Date(
						new Date().setMonth(new Date().getMonth() + 1)
					),
					jobPostQuota: getPlanQuota(plan!),
				},
			});

			console.log("User subscription updated successfully");

			const user = await prisma.user.findUnique({
				where: { mpesaReferenceId: checkoutDetails.checkoutRequestID },
			});

			if (!user) {
				throw new Error("User not found");
			}

			await prisma.payment.create({
				data: {
					user_id: user.id,
					amount: transactionDetails.amount,
					payment_method: "M-Pesa",
					payment_status: "succeeded",
					transactionId: transactionDetails.mpesaReceiptNumber,
				},
			});

			console.log("Payment details saved successfully");

			return res.status(200).json({
				status: "success",
				message:
					"Payment processed, subscription plan updated, and payment details saved",
			});
		} else {
			console.error(
				"Payment failed with result code:",
				stkCallback.ResultCode
			);
			console.error("Result description:", stkCallback.ResultDesc);
			return res.status(400).json({
				status: "error",
				message: stkCallback.ResultDesc,
			});
		}
	} catch (error: any) {
		console.error(error);
		return res.status(500).json({
			error: error.message,
		});
	}
};

const getPlanQuota = (plan: string): number => {
	const quotas: { [key: string]: number } = {
		Free_Trial: 3,
		Basic: 20,
		Pro: Infinity,
		Enterprise: Infinity,
	};
	return quotas[plan] || 0;
};

cron.schedule("*/15 * * * *", async () => {
	console.log("Cron job running...");
	try {
		const currentTime = new Date();
		const users = await prisma.user.findMany({
			where: {
				subscriptionEndDate: {
					lte: currentTime,
				},
			},
		});

		const planDuration = {
			Free_Trial: 0,
			Basic: 1,
			Pro: 1,
			Enterprise: 12,
		};

		for (const user of users) {
			const duration =
				planDuration[
					user.subscriptionPlan as keyof typeof planDuration
				] || 0;

			if (user.subscriptionEndDate! <= currentTime) {
				await prisma.user.update({
					where: { id: user.id },
					data: {
						jobPostQuota: 0,
					},
				});
			} else if (duration > 0) {
				const subscriptionEndDate = new Date();
				subscriptionEndDate.setMonth(
					subscriptionEndDate.getMonth() + duration
				);

				await prisma.user.update({
					where: { id: user.id },
					data: {
						subscriptionStartDate: new Date(),
						subscriptionEndDate,
						jobPostQuota: getPlanQuota(user.subscriptionPlan),
					},
				});
			}
		}
	} catch (error) {
		console.error("Error in subscription cron job:", error);
	}
});
