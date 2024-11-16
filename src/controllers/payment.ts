/** @format */

import { stripe } from "../config/stripe";
import { redis } from "../config/redis";  
import { NextFunction, Request, Response } from "express";
import { prisma } from "..";
import cron from "node-cron";

export const createPaymentIntent = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { id, amount } = req.body;

	try {
		// Step 1: Validate user from PostgreSQL
		const user = await prisma.user.findUnique({ where: { id: id } });
		if (!user) throw new Error("User not found");

		// Step 2: Create a PaymentIntent
		const paymentIntent = await stripe.paymentIntents.create({
			amount: amount * 100,
			currency: "usd",
			metadata: { id },
		});

		res.status(200).json({ clientSecret: paymentIntent.client_secret });
	} catch (error) {
		next(error);
	}
};

export const handlePaymentSuccess = async (req:Request, res:Response, next:NextFunction) => {
	const { paymentIntentId } = req.body;
	try {
		// Step 1: Retrieve PaymentIntent details
		const paymentIntent = await stripe.paymentIntents.retrieve(
			paymentIntentId
		);
		const { userId, jobDetails } = paymentIntent.metadata;

		// Step 2: Save payment details to the database
		await prisma.payment.create({
			data: {
				user_id: userId,
				amount: paymentIntent.amount,
				payment_method: paymentIntent.payment_method_types[0], // Assuming the first method used
				payment_status: paymentIntent.status, // Can be 'succeeded', 'failed', etc.
				transactionId: paymentIntent.id, // Use Stripe's payment intent ID as the transaction ID
			},
		});

		// Step 3: Start processing the job
		res.status(200).json({
			message: "Payment successful, job processing started",
		});
	} catch (error) {
		next(error);
	}
}

const getPriceId = (plan: string): string => {
	const priceIds: { [key: string]: string } = {
		Basic: "price_1QLrobB4ye5lKzaRFZjaZrX3...", // Replace with actual Stripe Price IDs
		Pro: "price_1QLrpTB4ye5lKzaRc0uDnzyh...",
		Premium: "price_1QLrqdB4ye5lKzaRhQ7V93U8...",
		Enterprise: "price_1QLrtcB4ye5lKzaRMfziUjz5...",
	};
	return priceIds[plan] || "";
};

export const createSubscription = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { id, plan } = req.body;

	try {
		const user = await prisma.user.findUnique({ where: { id } });
		if (!user) throw new Error("User not found");

		const stripeCustomer = await stripe.customers.create({
			email: user.email,
		});

		const planPriceId = getPriceId(plan); // Convert user-friendly plan to Stripe Price ID
		if (!planPriceId) throw new Error("Invalid plan selected");

		const subscription = await stripe.subscriptions.create({
			customer: stripeCustomer.id,
			items: [{ price: planPriceId }],
		});

		await prisma.user.update({
			where: { id },
			data: {
				subscriptionPlan: plan,
				subscriptionStartDate: new Date(),
				subscriptionEndDate: new Date(
					new Date().setMonth(new Date().getMonth() + 1)
				), // Set subscription end date to 1 month from now
				jobPostQuota: getPlanQuota(plan), // Function to determine quota based on plan
			},
		});

		res.status(200).json({
			message: "Subscription created successfully",
			subscription,
		});
	} catch (error) {
		next(error);
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
