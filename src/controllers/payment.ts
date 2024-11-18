/** @format */

import { stripe } from "../config/stripe";
import jwt from "jsonwebtoken";
import { NextFunction, Request, Response } from "express";
import { prisma } from "..";
import cron from "node-cron";
import createHttpError from "http-errors";

export const createPaymentIntent = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { id, amount } = req.body;

	try {
		if (!id) {
			return res
				.status(400)
				.json({
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

export const handlePaymentSuccess = async (
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
				transactionId: paymentIntent.id, // Use Stripe's payment intent ID as the transaction ID
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
		Premium: "price_1QLrqdB4ye5lKzaRhQ7V93U8",
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

		// Get the Stripe price ID for the selected plan ::f(x) for the plan is line 77
		const planPriceId = getPriceId(plan);
		if (!planPriceId) throw new Error("Invalid plan selected");

		// Create the subscription
		const subscription = await stripe.subscriptions.create({
			customer: stripeCustomerId,
			items: [{ price: planPriceId }],
		});

		// Update the user record in the database with subscription details
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

const getPlanQuota = (plan: string): number => {
	const quotas: { [key: string]: number } = {
		Free_Trial: 3,
		Basic: 5,
		Pro: 10,
		Premium: 20,
	};
	return quotas[plan] || 0;
};
/* cron  "0 0 1 * *" means
 *   0 0 → Run at 00:00 (midnight)
 *   1 → On the first day of the month
 *   * * → Every month, every day of the week
 */

cron.schedule("0 0 1 * *", async () => {
	try {
		const users = await prisma.user.findMany({
			where: { subscriptionEndDate: { lte: new Date() } },
		});
		for (const user of users) {
			await prisma.user.update({
				where: { id: user.id },
				data: {
					jobPostQuota: getPlanQuota(user.subscriptionPlan), // Reset quota dynamically
					subscriptionStartDate: new Date(),
					subscriptionEndDate: new Date(
						new Date().setMonth(new Date().getMonth() + 1)
					), // Extend subscription
				},
			});
		}
		console.log("Cron job executed successfully: Subscriptions updated");
	} catch (error) {
		console.error("Error in subscription cron job:", error);
	}
});
