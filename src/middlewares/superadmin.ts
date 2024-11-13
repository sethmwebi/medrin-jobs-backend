import { Role } from "@prisma/client";
import { NextFunction } from "express";

interface RequestWithUser extends Request {
  user?: { role: Role };
}

const admin = (req: RequestWithUser, res: any, next: NextFunction) => {
  if (req.user && req.user.role === Role.SUPERADMIN) {
    return next();
  }
  return res.status(403).json({ message: "Action is forbidden!" });
};

export default admin;
