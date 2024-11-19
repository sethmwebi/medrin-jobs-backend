// src/types/express.d.ts

import { Request } from 'express';

declare global {
  namespace Express {
    interface Request {
      userId?: string;  // Extend the Request type to include userId
    }
  }
}
