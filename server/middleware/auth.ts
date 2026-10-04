import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { ApiError } from '../lib/http';
import { AppUserModel } from '../models/AppUser';
import { InmobiliariaModel } from '../models/Inmobiliaria';
import { serializeUser } from '../lib/serialize';
import type { AppUser, UserRole } from '../../src/types';

export const SESSION_COOKIE = 'inmotask_session';
const SESSION_MAX_AGE_MS = 1000 * 60 * 60 * 12; // 12 h

export interface SessionClaims {
  sub: string;
  role: UserRole;
  /**
   * Se copia del usuario al firmar para no tener que ir a la base en cada
   * request, pero la autorización real usa SIEMPRE el valor fresco del documento
   * (ver requireAuth): si una inmobiliaria se da de baja, el token viejo no sirve.
   */
  inmoviliariaId: string;
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
  jwt.sign(
    { sub: user.id, role: user.role, inmoviliariaId: user.inmoviliariaId } satisfies SessionClaims,
    config.jwtSecret,
    { expiresIn: SESSION_MAX_AGE_MS }
  );

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

    // Una cuenta sin inmobiliaria no tiene contra qué acotar los datos, así que
    // se rechaza en vez de devolver una cartera global.
    if (!user.inmoviliariaId) {
      throw ApiError.unauthorized(
        'no-inmoviliaria',
        'Tu cuenta no está asociada a ninguna inmobiliaria. Pedíselo a tu administrador.'
      );
    }

    // La inmobiliaria del usuario tiene que seguir activa: si se da de baja la
    // empresa, sus usuarios pierden acceso aunque su propia cuenta siga activa.
    const inmobiliaria = await InmobiliariaModel.findById(user.inmoviliariaId).select('name active');
    if (!inmobiliaria) {
      throw ApiError.unauthorized('unknown-inmoviliaria', 'Tu inmobiliaria ya no existe.');
    }
    if (!inmobiliaria.active) {
      throw ApiError.unauthorized('inactive-inmoviliaria', 'Tu inmobiliaria está desactivada.');
    }

    // Se guarda el usuario ya serializado, no el documento de mongoose: si se
    // pasara el doc, req.user arrastraría _id, __v y los getters de mongoose,
    // y eso terminaría en el JSON de /auth/session.
    req.user = serializeUser(user, inmobiliaria.name);
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

/** El admin de una inmobiliaria: da de alta usuarios y ve los finanzas. */
export const requireAdmin = requireRole('admin');

/**
 * Filtro base que acota cualquier consulta a la inmobiliaria del usuario.
 *
 * Se usa como punto de partida del filtro en cada handler, no como middleware,
 * para que sea imposible olvidar el `...scope(req)` en un `find()` y que el
 * aislamiento quede a la vista en la misma línea que la query.
 */
export const scope = (req: Request): { inmoviliariaId: string } => {
  if (!req.user) {
    // No debería ocurrir: los routers con datos usan requireAuth antes. Si
    // llegara, es un bug de ruteo y conviene que se note y no que se devuelva
    // una cartera global.
    throw ApiError.unauthorized();
  }
  return { inmoviliariaId: req.user.inmoviliariaId };
};