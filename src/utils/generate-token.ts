import { Response } from "express";
import jwt from "jsonwebtoken";
import validEnv from "./validEnv";
import { prisma } from "..";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

// Generate both access and refresh tokens
const generateToken = async (res: Response, user: UserPayload) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  // Generate access token (shorter expiration)
  const accessToken = jwt.sign(payload, validEnv.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Generate refresh token (longer expiration)
  const refreshToken = jwt.sign(payload, validEnv.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set refresh token expiration date
  const refreshTokenExpiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  // update the user's refresh token in the database
  await prisma.user.update({
    where: { id: user.id },
    data: { refreshToken, refreshTokenExpiresAt },
  });

  // Set refresh token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: validEnv.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return { accessToken };
};

export default generateToken;
