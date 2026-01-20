import { Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import crypto from 'crypto';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    username: string;
    email: string | null;
    accessLevel: string;
  };
}

// Verify password against hashed password
function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, hash] = hashedPassword.split(':');
  const testHash = crypto.scryptSync(password, salt, 64).toString('hex');
  return hash === testHash;
}

// Login endpoint helper
export async function loginUser(username: string, password: string) {
  const user = await storage.getUserByUsername(username);
  
  if (!user) {
    throw new Error('Invalid username or password');
  }

  if (!verifyPassword(password, user.password)) {
    throw new Error('Invalid username or password');
  }

  return {
    id: user.id,
    username: user.username,
    email: user.email,
    accessLevel: user.accessLevel
  };
}

// Middleware to check if user is logged in (basic check)
export const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  // In a full implementation, this would check session/JWT
  // For now, we'll pass through and let routes handle auth
  const userId = req.headers['x-user-id'] as string;
  
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await storage.getUser(userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req.user = {
    id: user.id,
    username: user.username,
    email: user.email,
    accessLevel: user.accessLevel
  };

  next();
};

// Middleware to check if user has required access level
export const requireAccessLevel = (minLevel: string) => {
  const levelHierarchy: { [key: string]: number } = {
    'waiting': 0,
    'basic': 1,
    'advanced': 2,
    'premium': 3,
    'admin': 4
  };

  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    const userLevel = levelHierarchy[req.user.accessLevel] || 0;
    const requiredLevel = levelHierarchy[minLevel] || 0;

    if (userLevel < requiredLevel) {
      return res.status(403).json({ 
        error: 'Insufficient permissions',
        message: `This feature requires ${minLevel} access level or higher`
      });
    }

    next();
  };
};

// Middleware specifically for admin-only routes
export const requireAdmin = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.user.accessLevel !== 'admin') {
    return res.status(403).json({ 
      error: 'Admin access required',
      message: 'This feature is only available to administrators'
    });
  }

  next();
};
