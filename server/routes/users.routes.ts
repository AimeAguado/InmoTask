import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { AppUserModel } from '../models/AppUser';
import { serializeUser } from '../lib/serialize';
import { ApiError, asyncHandler } from '../lib/http';
import { asBoolean, asEnum, asString } from '../lib/validation';
import { requireAuth, requireRole } from '../middleware/auth';
import type { UserRole } from '../../src/types';

const ROLES: readonly UserRole[] = ['asesor', 'jefatura'];
const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;

export const usersRouter = Router();

// Toda la gestión de cuentas es exclusiva de jefatura, que es el único rol con
// canManageUsers en la app. El check vive acá y no en el cliente para que un
// asesor no pueda invocar el endpoint.
usersRouter.use(requireAuth, requireRole('jefatura'));

usersRouter.get(
  '/',
  asyncHandler(async (_req, res) => {
    const docs = await AppUserModel.find().sort({ active: -1, name: 1 });
    res.json({ users: docs.map(serializeUser) });
  })
);

usersRouter.post(
  '/',
  asyncHandler(async (req, res) => {
    const name = asString(req.body?.name, 'name', { required: true, max: 120 });
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
      name,
      email,
      role,
      phone,
      license,
      avatar,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    });

    res.status(201).json({ user: serializeUser(created) });
  })
);

usersRouter.patch(
  '/:id/active',
  asyncHandler(async (req, res) => {
    const active = asBoolean(req.body?.active, true);
    const target = await AppUserModel.findById(req.params.id);

    if (!target) throw ApiError.notFound('Usuario no encontrado.');
    if (!active && String(target._id) === req.user?.id) {
      // Desactivarse a sí mismo dejaría la app sin ningún usuario con acceso.
      throw ApiError.conflict('self-deactivate', 'No podés desactivar tu propia cuenta.');
    }

    target.active = active;
    await target.save();
    res.json({ user: serializeUser(target) });
  })
);

usersRouter.patch(
  '/:id/role',
  asyncHandler(async (req, res) => {
    const role = asEnum<UserRole>(req.body?.role, 'role', ROLES, { required: true });
    const target = await AppUserModel.findById(req.params.id);

    if (!target) throw ApiError.notFound('Usuario no encontrado.');
    if (String(target._id) === req.user?.id && role !== 'jefatura') {
      // Igual que arriba: la última jefatura activa no puede perder el rol.
      throw ApiError.conflict('self-demote', 'No podés cambiar tu propio rol.');
    }

    target.role = role;
    await target.save();
    res.json({ user: serializeUser(target) });
  })
);