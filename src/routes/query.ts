import { Request, Response, Router } from "express";
import { prisma } from "..";


const router = Router();

router.get("/", async () => {
  const users = await prisma.user.findMany()
})

export default router;
