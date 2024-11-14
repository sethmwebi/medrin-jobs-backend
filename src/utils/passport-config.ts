import { Request } from "express";
import { UserRole } from "@prisma/client";
import passport from "passport";
import {
  Strategy as JWTStrategy,
  StrategyOptions,
  VerifiedCallback,
} from "passport-jwt";
import {
  Strategy as GoogleStrategy,
  Profile as GoogleProfile,
} from "passport-google-oauth20";

import { VerifyCallback } from "passport-oauth2";
import { prisma } from "..";
import validEnv from "./validEnv";
import { oauthStrategyCallback } from "./oauthStrategyCallback";

const cookieExtractor = (req: Request): string | null => {
  let token: string | null = null;
  if (req && req.cookies) {
    token = req.cookies["accessToken"];
  }
  return token;
};

interface JWTPayload {
  id: string;
  email: string;
  role: UserRole;
  iat: number;
  exp: number;
  accessToken?: string;
  refreshToken?: string;
}

const jwtOptions: StrategyOptions = {
  jwtFromRequest: cookieExtractor,
  secretOrKey: validEnv.JWT_SECRET,
  passReqToCallback: true,
};

passport.use(
  new JWTStrategy(
    jwtOptions,
    async (req: Request, jwtPayload: JWTPayload, done: VerifiedCallback) => {
      try {
        const user = await prisma.user.findUnique({
          where: { id: jwtPayload.id },
        });

        if (user) {
          req.user = {
            ...user,
            accessToken: jwtPayload.accessToken,
            refreshToken: jwtPayload.refreshToken,
          };
          return done(null, req.user, req);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    },
  ),
);

passport.use(
  new GoogleStrategy(
    {
      clientID: validEnv.GOOGLE_CLIENT_ID,
      clientSecret: validEnv.GOOGLE_CLIENT_SECRET,
      callbackURL: validEnv.GOOGLE_CALLBACK,
      passReqToCallback: true,
    },
    (
      req: Request,
      accessToken: string,
      refreshToken: string,
      profile: GoogleProfile,
      done: VerifyCallback,
    ) => {
      oauthStrategyCallback({
        req,
        accessToken,
        refreshToken,
        profile,
        provider: "google",
        done,
      });
    },
  ),
);

export default passport;
