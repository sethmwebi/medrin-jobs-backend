import createHttpError, { HttpError, isHttpError } from 'http-errors';
import { Request, Response, NextFunction, ErrorRequestHandler } from "express";


export const errorHandler = (
	err: HttpError,
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const statusCode = err.status || 500;
	res.status(statusCode).json({
		status: statusCode,
		message: err.message || "An unexpected error occurred",
	});
};
