import { UserRole, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request extends User {
      role: UserRole;
    }
  }
}

export {};
