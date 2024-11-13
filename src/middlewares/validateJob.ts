import { body, validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";
import createError from "http-errors";

export const validateJob = [
	body("title").notEmpty().withMessage("Title is required"),
  body("description").notEmpty().withMessage("Description is required"),
  body("category").notEmpty().withMessage("Category is required"),
  body("location").notEmpty().withMessage("Location is required"),
  body("salary").notEmpty().withMessage("Salary is required"),
  body("company").notEmpty().withMessage("Company is required"),
  body("email").notEmpty().withMessage("Email is required"),
  body("contact").notEmpty().withMessage("Contact is required"),
	(req: Request, res: Response, next: NextFunction) => {
		const errors = validationResult(req);
		if (errors.isEmpty()) {
			return next(
				createError(
					400,
				"All fields are required"
				)
			);
		}
		next();
	},
];
