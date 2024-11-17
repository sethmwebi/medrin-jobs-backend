import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

// Extend Request interface to include userId
interface AuthRequest extends Request {
  userId?: string;
}

// Middleware to authenticate users
export const authenticateUser = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  const token = req.header('Authorization')?.split(' ')[1];

  if (!token) {
    res.status(401).json({ message: 'Access denied. No token provided.' });
    return;
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    req.userId = decoded.id;  // Attach userId to req
    next();  // Pass control to the next middleware/route handler
  } catch (error) {
    res.status(400).json({ message: 'Invalid token.' });
  }
};
