import { Response } from "express";
import jwt from "jsonwebtoken";
import validEnv from "./validEnv";

export interface UserPayload {
  id: string;
  email: string;
  role: string;
}

// Generate both access and refresh tokens
const generateToken = (res: Response, user: UserPayload) => {
  const payload = { id: user.id, email: user.email, role: user.role };

  // Generate access token (shorter expiration)
  const accessToken = jwt.sign(payload, validEnv.JWT_SECRET, {
    expiresIn: "15m",
  });

  // Generate refresh token (longer expiration)
  const refreshToken = jwt.sign(payload, validEnv.JWT_SECRET, {
    expiresIn: "30d",
  });

  // Set access token as an HTTP-only cookie
  res.cookie("accessToken", accessToken, {
    httpOnly: true,
    secure: validEnv.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 60 * 60 * 1000, // 15 minutes
  });

  // Set refresh token as an HTTP-only cookie
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: validEnv.NODE_ENV !== "development",
    sameSite: "strict",
    maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
  });

  return { accessToken, refreshToken };
};

export default generateToken;
