import { Router } from "express";
import * as AuthControllers from "../controllers/auth";
import passport from "passport";

const authRouter = Router();

authRouter.post("/register", AuthControllers.register);
authRouter.post("/login", AuthControllers.login);
authRouter.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] }),
);
authRouter.get("/auth/google/callback", AuthControllers.google);

authRouter.post("/forgot-password", AuthControllers.forgotPassword);
authRouter.post("/reset-password/:token", AuthControllers.resetPassword);
authRouter.post("/verify-email", AuthControllers.verifyEmail);
authRouter.post("/logout", AuthControllers.logout);


export default authRouter;
