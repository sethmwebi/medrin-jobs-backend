import { Router } from "express";
import * as RefreshTokenControllers from "../controllers/refreshToken";

const refreshRouter = Router();

refreshRouter.post("/refresh-token", RefreshTokenControllers.refreshToken);

export default refreshRouter;
