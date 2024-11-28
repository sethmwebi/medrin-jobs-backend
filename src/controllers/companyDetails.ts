// controllers/employerController.ts
import { Request, Response } from "express";
import { prisma } from ".."
import { get } from "http";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";

export const updateEmployerDetails = async (req: Request, res: Response) => {
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

		const userId = decoded.id;

		if (!userId) {
			return res.status(400).json({
				error: `User ID is required here is your body ${req.body} and ${userId}`,
			});
		}

    const { companyName, companySize, companyLocation, companyWebsite, industry ,phoneNumber} = req.body;

    const updatedEmployer = await prisma.user.update({
      where: { id: userId },
      data: {
        companyName,
        companySize,
        companyLocation,
        companyWebsite,
        industry,
        phoneNumber
      },
    });

    res.status(200).json({ message: "Employer details updated successfully", updatedEmployer });
  } catch (error) {
    console.error("Error updating employer details:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};

export const getUserProfile = async (req: Request, res: Response) => {
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

		const userId = decoded.id;
   
    const user = await prisma.user.findUnique({ where: { id:userId } });
    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Error fetching user profile:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};