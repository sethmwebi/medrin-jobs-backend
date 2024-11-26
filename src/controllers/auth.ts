import { NextFunction, Request, RequestHandler, Response } from "express";
import { RegisterSchema } from "../schemas/RegisterSchema";
import { prisma } from "..";
import createHttpError from "http-errors";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generate-token";
import { LoginSchema } from "../schemas/LoginSchema";
import { User } from "@prisma/client";
import passport from "passport";
import crypto from "crypto";

import {
  sendPasswordResetEmail,
  sendResetSuccessEmail,
  sendVerificationEmail,
  sendWelcomeEmail,
} from "../sendgrid/email";
import { generateVerificationToken } from "../utils/generateVerificationToken";
import { string } from "zod";

export const register: RequestHandler = async (req, res, next) => {
  try {
    const result = RegisterSchema.parse(req.body);
    const { email, password, name, role, provider = "credentials" } = result;

    // For checking if all information is provided
    if (!email || !password || !name) {
      throw new Error("Please provide all fields");
    }

    // check if the user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw createHttpError(400, "User already exists");
    }

    //This is the password hashing spot
    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = generateVerificationToken();

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        verificationToken,
        verificationTokenExpiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
        role,
        accounts: {
          create: {
            type: "local",
            provider,
            providerAccountId: email,
          },
        },
      },
    });

    const { accessToken, refreshToken } = generateToken(res, user);

    // This is for verification
    await sendVerificationEmail(user.email, verificationToken);

    const {
      password: _,
      createdAt,
      updatedAt,
      emailVerified,
      ...userData
    } = user;
    res.status(201).json({ userData, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

export const verifyEmail = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { code } = req.body;
  try {
    const user = await prisma.user.findFirst({
      where: {
        verificationToken: code,
        verificationTokenExpiresAt: { gt: new Date() }, // Ensures token has not expired
      },
    });

    if (!user) {
      res.status(400).json({
        success: false,
        message: "Invalid or expired verification code",
      });
      return;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: {
        isVerified: true,
        verificationToken: undefined, // After becoming true the verification code becomes undefined
        verificationTokenExpiresAt: undefined, // since there is no token this also will have to change
      },
    });

    // @ts-ignore
    await sendWelcomeEmail(user.email, user.name);

    res.status(200).json({
      success: true,
      message: "Email verified successfully",
      user: {
        ...user,
        password: undefined,
      },
    });
  } catch (error: any) {
    res.status(400).json({ success: false, message: error.message });
  }
};

export const login: RequestHandler = async (req, res, next) => {
  try {
    const result = LoginSchema.parse(req.body);
    const { email, password } = result;

    // check if user is registered using social logins
    const socialLoginAccount = await prisma.account.findFirst({
      where: { user: { email }, AND: { NOT: { provider: "credentials" } } },
    });

    if (socialLoginAccount) {
      throw createHttpError(400, "social login required for this email");
    }
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      throw createHttpError(400, "Invalid email or password");
    }

    const validPassword = await bcrypt.compare(password, user.password!);
    if (!validPassword) {
      throw createHttpError(400, "Invalid email or password");
    }

    const {
      password: _,
      createdAt,
      updatedAt,
      emailVerified,
      ...userData
    } = user;
    const { accessToken, refreshToken } = generateToken(res, user);
    res.status(201).json({ userData, accessToken, refreshToken });
  } catch (error) {
    next(error);
  }
};

const handleOAuthCallback = (
  err: any,
  user: User | false,
  _: Request,
  res: Response,
  next: NextFunction
) => {
  if (err) {
    if (err.name === "TokenError") {
      if (err.message.includes("expired")) {
        return next(createHttpError(401, "Token has expired"));
      } else if (err.message.includes("invalid")) {
        return next(createHttpError(401, "Token is invalid"));
      } else if (err.message.includes("missing")) {
        return next(createHttpError(400, "Token is missing"));
      } else {
        return next(createHttpError(401, "Token error"));
      }
    } else {
      return next(err);
    }
  }

  if (!user) {
    return next(createHttpError(401, "Authentication failed"));
  }

  generateToken(res, user);
  res.redirect("/");
};

export const google: RequestHandler = async (req, res, next) => {
  passport.authenticate("google", (err: any, user: User | false, info: any) => {
    handleOAuthCallback(err, user, req, res, next);
  })(req, res, next);
};

export const logout = async (req: Request, res: Response): Promise<void> => {
  res.clearCookie("token");
  res.status(200).json({
    success: true,
    message: "Logged out successfully",
  });
};

export const forgotPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  const { email } = req.body;

  try {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      res.status(400).json({ success: false, message: "User not found" });
      return;
    }

    const resetToken = crypto.randomBytes(20).toString("hex");
    const resetTokenExpiresAt = new Date(Date.now() + 1 * 60 * 60 * 1000);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetPasswordToken: resetToken,
        resetPasswordExpiresAt: resetTokenExpiresAt,
      },
    });

    //Once the frontend is updated the client URL will also need to be updated

    await sendPasswordResetEmail(
      user.email,
      `${process.env.CLIENT_URL}/reset-password/${resetToken}`
    );

    res.status(200).json({
      success: true,
      message: "Password reset email sent successfully",
    });
  } catch (error: any) {
    console.log("Error in forgotPassword", error);
    res.status(400).json({ success: false, message: error.message });
  }
};

export const resetPassword = async (
  req: Request,
  res: Response
): Promise<void> => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const user = await prisma.user.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpiresAt: { gt: new Date() },
      },
    });

    if (!user) {
      res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset token" });
      return;
    }

    // update password
    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        resetPasswordToken: undefined,
        resetPasswordExpiresAt: undefined,
      },
    });

    await sendResetSuccessEmail(user.email);

    res
      .status(200)
      .json({ success: true, message: "Password reset successful" });
  } catch (error: any) {
    console.log("Error in resetPassword ", error);
    res.status(400).json({ success: false, message: error.message });
  }
};
