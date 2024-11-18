import { Request, Response, NextFunction } from "express";
import jwt, { JwtPayload } from "jsonwebtoken";
import { prisma } from "..";
import validateEnv from "../utils/validateEnv";
import generateToken from "../utils/generate-token";
import createHttpError from "http-errors";
import validEnv from "../utils/validEnv";

export const refreshToken = async (
  req: Request,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      throw createHttpError(401, "Unauthorized!");
    }

    // Decode and verify the refresh token
    const decoded = jwt.verify(refreshToken, validEnv.JWT_SECRET) as JwtPayload;

    const user = await prisma.user.findFirst({
      where: {
        id: decoded.id,
        refreshToken,
      },
    });

    if (
      !user ||
      !user.refreshTokenExpiresAt ||
      new Date() > user.refreshTokenExpiresAt
    ) {
      throw createHttpError(401, "Invalid or expired refresh token");
    }

    // generate new access and refresh tokens
    const tokens = await generateToken(res, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    res.status(200).json({ success: true, ...tokens });
  } catch (error) {
    next(error);
  }
};
