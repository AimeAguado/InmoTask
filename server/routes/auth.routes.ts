import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { config } from '../config.js';
import { AppUserModel } from '../models/AppUser.js';
import { InmobiliariaModel } from '../models/Inmobiliaria.js';
import { serializeUser } from '../lib/serialize.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { assertPasswordStrength, hashPassword, SALT_ROUNDS, verifyPassword } from '../lib/password.js';
import { asString } from '../lib/validation.js';
import { saveAvatar } from '../lib/avatarStorage.js';
import { verifyGoogleCredential } from '../lib/googleAuth.js';
import { destroyUserSessions, requireAuth, revokeSession, setSessionCookie, signSession } from '../middleware/auth.js';

// Hash señuelo generado al arrancar: se compara contra él cuando el email no
// existe, para que ese camino gaste lo mismo que un login real y el tiempo de
// respuesta no revele qué emails están registrados.
const decoyHash = bcrypt.hashSync('inmotask-decoy-password', SALT_ROUNDS);

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Teléfono: '+' opcional al inicio y dígitos, espacios, ( ), . o guiones.
const PHONE_RE = /^\+?[\d\s().-]{6,20}$/;

const assertEmailFormat = (email: string): void => {
  if (!EMAIL_RE.test(email)) {
    throw ApiError.badRequest('validation_error', 'El email no tiene un formato válido.');
  }
};

const assertPhoneFormat = (phone: string): void => {
  if (!PHONE_RE.test(phone) || !/\d/.test(phone)) {
    throw ApiError.badRequest(
      'validation_error',
      'El teléfono no tiene un formato válido: usá solo números, espacios, +, ( ), . o guiones.'
    );
  }
};

/** Escapa caracteres reservados de regex para buscar un nombre exacto con 'i'. */
const escapeRegExp = (value: string): string => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

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

    setSessionCookie(res, await signSession(serializeUser(user)));
    // requireAuth resuelve la inmobiliaria en cada request; acá se consulta una
    // vez para que la UI pueda mostrar "InmoTask" junto al usuario desde el login.
    const inmobiliaria = await InmobiliariaModel.findById(user.inmoviliariaId).select('name active');
    res.json({ user: serializeUser(user, inmobiliaria?.name ?? '') });
  })
);

/**
 * Configuración pública que necesita la pantalla de login. No expone secretos:
 * el client id de Google es público por diseño (es el que el navegador usa para
 * pedir el id_token), así que se devuelve acá para configurar GIS en el front.
 */
authRouter.get('/config', (_req, res) => {
  res.json({
    googleEnabled: Boolean(config.googleClientId),
    googleClientId: config.googleClientId,
  });
});

/**
 * Login con Google.
 *
 * 1. El navegador manda el id_token verificado por Google (GIS).
 * 2. El servidor valida firma/audiencia/expiración y obtiene el email verificado.
 * 3. Si ese email existe y está activo, se abre sesión. NO crea cuentas nuevas:
 *    alguien sin cuenta recibe un error claro pidiendo que su admin lo dé de alta.
 */
authRouter.post(
  '/google',
  asyncHandler(async (req, res) => {
    const credential = asString(req.body?.credential, 'credential', { required: true, max: 12000 });
    const { email } = await verifyGoogleCredential(credential);

    const user = await AppUserModel.findOne({ email });
    if (!user) {
      throw ApiError.unauthorized(
        'google-email-not-found',
        'No existe una cuenta de InmoTask asociada a este email. Solicitá al administrador que cree tu usuario.'
      );
    }
    if (!user.active) {
      throw ApiError.unauthorized('inactive-user', 'Tu cuenta está desactivada. Contactá al administrador.');
    }

    setSessionCookie(res, await signSession(serializeUser(user)));
    const inmobiliaria = await InmobiliariaModel.findById(user.inmoviliariaId).select('name active');
    res.json({ user: serializeUser(user, inmobiliaria?.name ?? '') });
  })
);

/**
 * Autoregistro de un usuario que pide unirse a una inmobiliaria existente.
 *
 * Es la única vía pública de alta. Para que cualquiera no pueda colarse en una
 * empresa ajena:
 *   - la inmobiliaria se busca por nombre en la base y tiene que estar activa
 *     (el front nunca manda un ObjectId ni puede elegir el tenant),
 *   - el usuario se crea INACTIVO (active: false): no puede ingresar hasta que
 *     un admin de esa inmobiliaria lo active desde "Usuarios", y
 *   - el rol siempre es 'asesor'; a un recién llegado jamás se lo autonombra admin.
 */
authRouter.post(
  '/register',
  asyncHandler(async (req, res) => {
    const firstName = asString(req.body?.firstName, 'firstName', { required: true, max: 80 });
    const lastName = asString(req.body?.lastName, 'lastName', { required: true, max: 80 });
    const email = asString(req.body?.email, 'email', { required: true, max: 160 }).toLowerCase();
    const password = asString(req.body?.password, 'password', { required: true, max: 200 });
    const phone = asString(req.body?.phone, 'phone', { required: true, max: 40 });
    const inmobiliariaName = asString(req.body?.inmobiliaria, 'inmobiliaria', {
      required: true,
      max: 160,
    });

    assertEmailFormat(email);
    assertPasswordStrength(password);
    assertPhoneFormat(phone);

    if (!firstName.trim() || !lastName.trim()) {
      throw ApiError.badRequest(
        'validation_error',
        'El nombre y el apellido no pueden quedar vacíos.'
      );
    }

    // La empresa se resuelve en el servidor, nunca se acepta un id del cliente.
    const inmobiliaria = await InmobiliariaModel.findOne({
      name: { $regex: new RegExp(`^${escapeRegExp(inmobiliariaName.trim())}$`, 'i') },
      active: true,
    }).select('name active');
    if (!inmobiliaria) {
      throw ApiError.notFound(
        `No existe una inmobiliaria registrada con el nombre "${inmobiliariaName.trim()}". Solicitá al administrador que te cree el usuario.`
      );
    }

    const exists = await AppUserModel.exists({ email });
    if (exists) {
      throw ApiError.conflict('duplicate-email', 'Ya existe un usuario registrado con ese email.');
    }

    try {
      const created = await AppUserModel.create({
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        name: `${firstName.trim()} ${lastName.trim()}`,
        email,
        // pending: no entra hasta que un admin de la inmobiliaria lo active.
        active: false,
        role: 'asesor',
        inmoviliariaId: inmobiliaria._id,
        phone: phone.trim(),
        passwordHash: await hashPassword(password),
      });
      res.status(201).json({ user: serializeUser(created, inmobiliaria.name) });
    } catch (err) {
      // El chequeo previo cubre el caso normal, pero dos registros simultáneos
      // pueden colisionar en el índice único: se traduce al mismo 409.
      if (err && typeof err === 'object' && 'code' in err && err.code === 11000) {
        throw ApiError.conflict('duplicate-email', 'Ya existe un usuario registrado con ese email.');
      }
      throw err;
    }
  })
);

/**
 * Cambio de contraseña de la cuenta propia.
 *
 * Exige la contraseña actual a propósito. Si no la pidiera, cualquiera que se
 * hubiera quedado con la cookie de sesión (un XSS, una cookie robada en un
 * navegador compartido) podría fijar una contraseña nueva y quedarse con la
 * cuenta para siempre.
 */
authRouter.patch(
  '/password',
  requireAuth,
  asyncHandler(async (req, res) => {
    const currentPassword = asString(req.body?.currentPassword, 'currentPassword', {
      required: true,
      max: 200,
    });
    const newPassword = asString(req.body?.newPassword, 'newPassword', { required: true, max: 200 });

    const doc = await AppUserModel.findById(req.user!.id).select('+passwordHash');
    if (!doc) throw ApiError.unauthorized('unknown-user', 'La cuenta ya no existe.');

    if (!(await verifyPassword(currentPassword, doc.passwordHash))) {
      // 400 y no 401: la sesión sigue siendo válida, lo que falló es un dato del
      // formulario. Un 401 haría que el front cierre sesión y loftie al login.
      throw ApiError.badRequest('wrong_password', 'La contraseña actual no es correcta.');
    }

    if (await verifyPassword(newPassword, doc.passwordHash)) {
      throw ApiError.badRequest(
        'same_password',
        'La contraseña nueva tiene que ser distinta de la actual.'
      );
    }

    assertPasswordStrength(newPassword);

    doc.passwordHash = await hashPassword(newPassword);
    await doc.save();

    // La clave cambió: todas las sesiones viejas se revocan en la base para que
    // una cookie emitida antes de este cambio deje de servir en cualquier
    // dispositivo, no sólo en el que está pidiendo.
    await destroyUserSessions(String(doc._id));

    res.status(204).end();
  })
);

authRouter.post(
  '/logout',
  asyncHandler(async (req, res) => {
    // Cerrar sesión borra el documento de AuthSession referenciado por el jti:
    // la cookie se limpia y además el token deja de ser válido en la base.
    await revokeSession(req, res);
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
 * teléfono, foto y email (que pasa a ser su nuevo login), pero NO su rol ni su
 * inmobiliaria: eso los cambia el admin de su empresa. Es la contraparte de
 * /api/users, que exige permisos de admin.
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

    if (req.body?.email !== undefined) {
      const email = asString(req.body.email, 'email', { required: true, max: 160 })
        .trim()
        .toLowerCase();
      assertEmailFormat(email);

      // El email es la identidad de login (y la llave del "Continuar con Google"),
      // así que tiene que seguir siendo único en el sistema, no por inmobiliaria.
      const taken = await AppUserModel.exists({ email, _id: { $ne: doc._id } });
      if (taken) {
        throw ApiError.conflict('duplicate-email', 'Ya existe un usuario registrado con ese email.');
      }
      doc.email = email;
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