import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../lib/http';
import { AppUserModel } from '../models/AppUser';
import { serializeUser } from '../lib/serialize';
import type { AppUser, UserRole } from '../../src/types';

export const SESSION_COOKIE = 'inmotask_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 h

export interface SessionClaims {
  sub: string;
  role: UserRole;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: AppUser;
    }
  }
}

export const signSession = (user: AppUser): string =>
  jwt.sign({ sub: user.id, role: user.role } satisfies SessionClaims, config.jwtSecret, {
    expiresIn: SESSION_MAX_AGE_MS,
  });

export const setSessionCookie = (res: Response, token: string): void => {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    // Sin esto el token viaja en claro y un XSS trivial lo roba.
    secure: config.isProd,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
  });
};

export const clearSessionCookie = (res: Response): void => {
  res.clearCookie(SESSION_COOKIE, { path: '/' });
};

/**
 * Revalida contra la base en cada request en vez de confiar solo en el JWT: si
 * un usuario se desactiva o cambia de rol con la sesión abierta, el cambio tiene
 * que tener efecto ya y no cuando expire el token.
 */
export const requireAuth = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const token = req.cookies?.[SESSION_COOKIE];
    if (!token) throw ApiError.unauthorized('no-session', 'Iniciá sesión para continuar.');

    let claims: SessionClaims;
    try {
      claims = jwt.verify(token, config.jwtSecret) as SessionClaims;
    } catch {
      throw ApiError.unauthorized('invalid-session', 'Tu sesión expiró. Volvé a ingresar.');
    }

    const user = await AppUserModel.findById(claims.sub);
    if (!user) throw ApiError.unauthorized('unknown-user', 'La cuenta ya no existe.');
    if (!user.active) throw ApiError.unauthorized('inactive-user', 'Tu cuenta está desactivada.');

    // Se guarda el usuario ya serializado, no el documento de mongoose: si se
    // pasara el doc, req.user arrastraría _id, __v y los getters de mongoose,
    // y eso terminaría en el JSON de /auth/session.
    req.user = serializeUser(user);
    next();
  } catch (err) {
    next(err);
  }
};

export const requireRole =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) return next(ApiError.unauthorized());
    if (!roles.includes(req.user.role)) return next(ApiError.forbidden());
    next();
  };