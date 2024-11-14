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

export default authRouter;
