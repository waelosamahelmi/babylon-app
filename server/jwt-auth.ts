import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';
import { AuthUser } from './auth';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

export interface JWTPayload {
  id: number;
  email: string;
  role: string;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
}

export function generateToken(user: AuthUser): string {
  return jwt.sign(
    {
      id: user.id,
      email: user.email,
      role: user.role,
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN } as jwt.SignOptions
  );
}

export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

export function extractTokenFromRequest(req: Request): string | null {
  // Check Authorization header (Bearer token)
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }

  // Check query parameter
  if (req.query.token && typeof req.query.token === 'string') {
    return req.query.token;
  }

  // Check cookies
  if (req.cookies && req.cookies.auth_token) {
    return req.cookies.auth_token;
  }

  return null;
}

export function requireJWTAuth(req: AuthRequest, res: Response, next: NextFunction) {
  const token = extractTokenFromRequest(req);

  if (!token) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  // Add user info to request
  req.user = {
    id: payload.id,
    email: payload.email,
    role: payload.role,
  };

  next();
}

// Middleware that supports both session and JWT authentication
export function requireAuth(req: any, res: Response, next: NextFunction) {
  // First try JWT authentication
  const token = extractTokenFromRequest(req);
  if (token) {
    const payload = verifyToken(token);
    if (payload) {
      req.user = {
        id: payload.id,
        email: payload.email,
        role: payload.role,
      };
      return next();
    }
  }

  // Fall back to session authentication
  if (req.session && req.session.user) {
    req.user = req.session.user;
    return next();
  }

  return res.status(401).json({ error: 'Authentication required' });
}