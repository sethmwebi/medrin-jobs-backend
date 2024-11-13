import { Role, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request extends User {
      role: Role;
    }
  }
}

export {};
