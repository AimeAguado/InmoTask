import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AppUserModel } from '../models/AppUser';
import { serializeUser } from '../lib/serialize';
import { ApiError, asyncHandler } from '../lib/http';
import { asString } from '../lib/validation';
import { clearSessionCookie, requireAuth, setSessionCookie, signSession } from '../middleware/auth';

const SALT_ROUNDS = 12;

// Hash señuelo generado al arrancar: se compara contra él cuando el email no
// existe, para que ese camino gaste lo mismo que un login real y el tiempo de
// respuesta no revele qué emails están registrados.
const decoyHash = bcrypt.hashSync('inmotask-decoy-password', SALT_ROUNDS);

export const authRouter = Router();

authRouter.post(
  '/login',
  asyncHandler(async (req, res) => {
    const email = asString(req.body?.email, 'email', { required: true, max: 160 }).toLowerCase();
    const password = asString(req.body?.password, 'password', { required: true, max: 200 });

    // +passwordHash: el campo tiene select:false, hay que pedirlo explícito.
    const user = await AppUserModel.findOne({ email }).select('+passwordHash');
    // Mismo mensaje para usuario inexistente y password incorrecto, para no
    // confirmar qué emails están registrados.
    const invalid = ApiError.unauthorized('invalid-credentials', 'Email o contraseña incorrectos.');

    if (!user) {
      await bcrypt.compare(password, decoyHash);
      throw invalid;
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) throw invalid;
    if (!user.active) {
      throw ApiError.unauthorized('inactive-user', 'Tu cuenta está desactivada. Contactá a jefatura.');
    }

    setSessionCookie(res, signSession(serializeUser(user)));
    res.json({ user: serializeUser(user) });
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (_req, res) => {
    clearSessionCookie(res);
    res.status(204).end();
  })
);

authRouter.get(
  '/session',
  requireAuth,
  asyncHandler(async (req, res) => {
    // requireAuth ya dejó un AppUser limpio en req.user: no hace falta volver a
    // pasar el documento por el serializer.
    res.json({ user: req.user });
  })
);