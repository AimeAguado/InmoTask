import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AppUserModel } from '../models/AppUser.js';
import { serializeUser } from '../lib/serialize.js';
import { ApiError, asyncHandler } from '../lib/http.js';
import { asBoolean, asEnum, asString } from '../lib/validation.js';
import { requireAuth, requireAdmin, scope } from '../middleware/auth.js';
import { saveAvatar } from '../lib/avatarStorage.js';
import type { UserRole } from '../../src/types/index.js';

const ROLES: readonly UserRole[] = ['admin', 'asesor'];
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export const usersRouter = Router();

// Todo el router es de administración: los permisos de la propia cuenta se
// editan desde /api/me, que sólo requiere sesión.
usersRouter.use(requireAuth, requireAdmin);

const fullName = (firstName: string, lastName: string): string =>
  `${firstName} ${lastName}`.trim();

/** Devuelve el documento si pertenece a la inmobiliaria del admin, o 404. */
const findInTenant = async (id: string, inmoviliariaId: string) => {
  const target = await AppUserModel.findOne({ _id: id, inmoviliariaId });
  if (!target) {
    // 404 y no 403 a propósito: no se le confirma a un admin que el usuario existe
    // si es de otra inmobiliaria.
    throw ApiError.notFound('Usuario no encontrado.');
  }
  return target;
};

usersRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const docs = await AppUserModel.find(scope(req))
      .sort({ active: -1, firstName: 1, lastName: 1 })
      .populate('inmoviliariaId', 'name');
    res.json({ users: docs.map((doc) => serializeUser(doc)) });
  })
);

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const firstName = asString(req.body?.firstName, 'firstName', { required: true, max: 80 });
    const lastName = asString(req.body?.lastName, 'lastName', { required: true, max: 80 });
    const email = asString(req.body?.email, 'email', { required: true, max: 160 }).toLowerCase();
    const password = asString(req.body?.password, 'password', { required: true, max: 200 });
    const role = asEnum<UserRole>(req.body?.role, 'role', ROLES, { fallback: 'asesor' });
    const phone = asString(req.body?.phone, 'phone', { max: 40 });
    const license = asString(req.body?.license, 'license', { max: 80 });
    const avatar = asString(req.body?.avatar, 'avatar', { max: 500 });

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw ApiError.badRequest(
        'weak_password',
        `La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`
      );
    }
    if (!email.includes('@')) {
      throw ApiError.badRequest('validation_error', 'El email no tiene un formato válido.');
    }

    const exists = await AppUserModel.exists({ email });
    if (exists) {
      throw ApiError.conflict('duplicate-email', 'Ya existe un usuario con ese email.');
    }

    const created = await AppUserModel.create({
      firstName,
      lastName,
      name: fullName(firstName, lastName),
      email,
      role,
      // La inmobiliaria sale de la sesión, nunca del body: si el admin pudiera
      // mandarla, podría crear usuarios en empresas ajenas.
      inmoviliariaId: req.user!.inmoviliariaId,
      phone,
      license,
      avatar,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    });

    res.status(201).json({ user: serializeUser(created, req.user!.inmoviliaria) });
  })
);

/** Alta y edición de un asesor por parte del admin de su propia inmobiliaria. */
usersRouter.patch(
  '/:id',
  asyncHandler(async (req, res) => {
    const target = await findInTenant(req.params.id, req.user!.inmoviliariaId);

    if (req.body?.firstName !== undefined || req.body?.lastName !== undefined) {
      const firstName = asString(req.body?.firstName, 'firstName', { max: 80 });
      const lastName = asString(req.body?.lastName, 'lastName', { max: 80 });
      const nextFirst = firstName || target.firstName;
      const nextLast = lastName || target.lastName;
      if (!nextFirst.trim() || !nextLast.trim()) {
        throw ApiError.badRequest(
          'validation_error',
          'El nombre y el apellido no pueden quedar vacíos.'
        );
      }
      target.firstName = nextFirst.trim();
      target.lastName = nextLast.trim();
      target.name = fullName(target.firstName, target.lastName);
    }

    if (req.body?.phone !== undefined) {
      target.phone = asString(req.body?.phone, 'phone', { max: 40 });
    }
    if (req.body?.license !== undefined) {
      target.license = asString(req.body?.license, 'license', { max: 80 });
    }
    // Avatar: llega como data URL y se guarda como archivo; si viene una ruta
    // ya escrita se acepta, para no romper los avatares que ya están cargados.
    if (req.body?.avatar !== undefined) {
      target.avatar = await saveAvatar(
        req.body.avatar,
        String(target._id),
        req.user!.inmoviliariaId
      );
    }

    await target.save();
    res.json({ user: serializeUser(target, req.user!.inmoviliaria) });
  })
);

usersRouter.patch(
  '/:id/active',
  asyncHandler(async (req, res) => {
    const active = asBoolean(req.body?.active, true);
    const target = await findInTenant(req.params.id, req.user!.inmoviliariaId);

    if (!active && String(target._id) === req.user?.id) {
      // Desactivarse a sí mismo dejaría la app sin ningún usuario con acceso.
      throw ApiError.conflict('self-deactivate', 'No podés desactivar tu propia cuenta.');
    }

    target.active = active;
    await target.save();
    res.json({ user: serializeUser(target, req.user!.inmoviliaria) });
  })
);

usersRouter.patch(
  '/:id/role',
  asyncHandler(async (req, res) => {
    const role = asEnum<UserRole>(req.body?.role, 'role', ROLES, { required: true });
    const target = await findInTenant(req.params.id, req.user!.inmoviliariaId);

    if (String(target._id) === req.user?.id && role !== 'admin') {
      throw ApiError.conflict('self-demote', 'No podés cambiar tu propio rol.');
    }

    target.role = role;
    await target.save();
    res.json({ user: serializeUser(target, req.user!.inmoviliaria) });
  })
);
