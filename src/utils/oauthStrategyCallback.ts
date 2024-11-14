import { Request, Response } from "express";
import { Profile as GoogleProfile } from "passport-google-oauth20";
import createHttpError from "http-errors";
import { prisma } from "..";
import generateToken from "./generate-token"; // Import generateToken

type OAuthProfile = GoogleProfile;

interface OauthStrategyCallbackOptions {
  req: Request;
  accessToken: string;
  refreshToken: string;
  profile: OAuthProfile;
  provider: string;
  done: any;
}

export const oauthStrategyCallback = async ({
  req,
  accessToken,
  refreshToken,
  profile,
  provider,
  done,
}: OauthStrategyCallbackOptions): Promise<void> => {
  try {
    const email = profile.emails?.[0].value;
    if (!email) {
      return done(createHttpError(400, "No email found"), false);
    }

    let user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          role: "JOBSEEKER",
          name:
            provider === "google"
              ? profile.displayName
              : `${profile.name?.givenName || ""} ${profile.name?.familyName || ""}`.trim(),
          image: profile.photos?.[0].value ?? null,
          password: "",
          emailVerified: new Date(),
        },
      });

      await prisma.account.create({
        data: {
          userId: user.id,
          type: "oauth",
          provider,
          providerAccountId: profile.id,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      });
    } else {
      const account = await prisma.account.findUnique({
        where: {
          provider_providerAccountId: {
            provider,
            providerAccountId: profile.id,
          },
        },
      });

      if (!account) {
        await prisma.account.create({
          data: {
            userId: user.id,
            type: "oauth",
            provider,
            providerAccountId: profile.id,
            access_token: accessToken,
            refresh_token: refreshToken,
          },
        });
      }
    }

    const { password, emailVerified, createdAt, updatedAt, ...userData } = user;

    // Use generateToken to set access and refresh tokens as cookies
    generateToken(req.res as Response, {
      id: user.id,
      email: user.email,
      role: user.role,
    });

    return done(null, userData);
  } catch (error: any) {
    return done(error);
  }
};
