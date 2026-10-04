import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AppUserModel } from '../models/AppUser.js';
import { InmobiliariaModel } from '../models/Inmobiliaria.js';
import { serializeUser } from '../lib/serialize.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { asString } from '../lib/validation.js';
import { saveAvatar } from '../lib/avatarStorage.js';
import { clearSessionCookie, requireAuth, setSessionCookie, signSession } from '../middleware/auth.js';

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
      throw ApiError.unauthorized('inactive-user', 'Tu cuenta está desactivada. Contactá al administrador.');
    }

    setSessionCookie(res, signSession(serializeUser(user)));
    // requireAuth resuelve la inmobiliaria en cada request; acá se consulta una
    // vez para que la UI pueda mostrar "InmoTask" junto al usuario desde el login.
    const inmobiliaria = await InmobiliariaModel.findById(user.inmoviliariaId).select('name active');
    res.json({ user: serializeUser(user, inmobiliaria?.name ?? '') });
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

/**
 * Datos de la cuenta propia. El usuario puede editar su nombre, apellido,
 * teléfono y foto, pero NO su rol ni su inmobiliaria: eso los cambia el admin de
 * su empresa. Es la contraparte de /api/users, que exige permisos de admin.
 */
authRouter.patch(
  '/me',
  requireAuth,
  asyncHandler(async (req, res) => {
    const doc = await AppUserModel.findById(req.user!.id);
    if (!doc) throw ApiError.notFound('Usuario no encontrado.');

    if (req.body?.firstName !== undefined || req.body?.lastName !== undefined) {
      const firstName = req.body?.firstName
        ? asString(req.body.firstName, 'firstName', { max: 80 })
        : doc.firstName;
      const lastName = req.body?.lastName
        ? asString(req.body.lastName, 'lastName', { max: 80 })
        : doc.lastName;

      if (!firstName.trim() || !lastName.trim()) {
        throw ApiError.badRequest(
          'validation_error',
          'El nombre y el apellido no pueden quedar vacíos.'
        );
      }
      doc.firstName = firstName.trim();
      doc.lastName = lastName.trim();
      doc.name = `${doc.firstName} ${doc.lastName}`;
    }

    if (req.body?.phone !== undefined) {
      doc.phone = asString(req.body?.phone, 'phone', { max: 40 });
    }
    if (req.body?.avatar !== undefined) {
      doc.avatar = await saveAvatar(
        req.body.avatar,
        String(doc._id),
        String(doc.inmoviliariaId)
      );
    }

    await doc.save();
    res.json({ user: serializeUser(doc, req.user!.inmoviliaria) });
  })
);