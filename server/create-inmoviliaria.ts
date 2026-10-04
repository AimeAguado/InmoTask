/**
 * Alta de una inmobiliaria con su primer administrador.
 *
 *   npm run create:inmoviliaria -- --name "Pampa Bienes Raíces" \
 *     --legal-name "Pampa Bienes Raíces S.A." --tax-id "30-98765432-1" \
 *     --email "admin@pampabienes.com.ar" --password "una-buena-clave" \
 *     --first-name "Ana" --last-name "Pérez"
 *
 * Se hace por CLI y no desde la app a propósito: no existe un super-admin, así
 * que la primera cuenta de cada empresa la crea alguien con acceso a la base.
 * Esa persona es la única que después puede dar de alta asesores desde la app.
 *
 * Es transaccional por colección: si el usuario no se puede crear, se borra la
 * empresa recién creada para no dejar una inmobiliaria sin administrador.
 */
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDb, disconnectDb } from './db.js';
import { config } from './config.js';
import { InmobiliariaModel } from './models/Inmobiliaria.js';
import { AppUserModel } from './models/AppUser.js';
import { ApiError } from './lib/http.js';

const SALT_ROUNDS = 12;
const MIN_PASSWORD_LENGTH = 8;
const PROJECT_DB = 'inmotask';

type Args = Record<string, string>;

/** Lee --clave valor del argv. Sin valor, no cuenta como flag. */
const parseArgs = (argv: string[]): Args => {
  const out: Args = {};
  for (let i = 0; i < argv.length; i += 1) {
    const token = argv[i];
    if (!token.startsWith('--')) continue;
    const key = token.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith('--')) {
      out[key] = '';
    } else {
      out[key] = next;
      i += 1;
    }
  }
  return out;
};

const required = (args: Args, key: string): string => {
  const value = args[key]?.trim();
  if (!value) {
    throw new Error(`Falta el argumento obligatorio --${key}.`);
  }
  return value;
};

const usage = (): string => `
Uso:
  npm run create:inmoviliaria -- --name NOMBRE [opcionales]

Obligatorios:
  --name        Nombre comercial de la inmobiliaria (el que ve el usuario)
  --email       Email del primer administrador
  --password    Su contraseña (mínimo ${MIN_PASSWORD_LENGTH} caracteres)
  --first-name  Nombre del administrador
  --last-name   Apellido del administrador

Opcionales:
  --legal-name  Razón social
  --tax-id      CUIT / CUIL
  --phone       Teléfono de la empresa
  --company-email   Email de contacto de la empresa
  --skip-check  No exigir que la base sea "${PROJECT_DB}"
`.trim();

const main = async (): Promise<void> => {
  const args = parseArgs(process.argv.slice(2));

  if (args.help || Object.keys(args).length === 0) {
    console.log(usage());
    process.exit(Object.keys(args).length === 0 ? 1 : 0);
  }

  const name = required(args, 'name');
  const email = required(args, 'email').toLowerCase();
  const password = required(args, 'password');
  const firstName = required(args, 'first-name');
  const lastName = required(args, 'last-name');

  if (password.length < MIN_PASSWORD_LENGTH) {
    throw new Error(`La contraseña debe tener al menos ${MIN_PASSWORD_LENGTH} caracteres.`);
  }
  if (!email.includes('@')) {
    throw new Error('El email no tiene un formato válido.');
  }

  // Barrera de seguridad, igual que en el seed: este script escribe en Atlas.
  if (!args['skip-check'] && config.mongoDb !== PROJECT_DB) {
    throw new Error(
      `Sólo puede correr contra la base "${PROJECT_DB}" y MONGODB_DB dice ` +
        `"${config.mongoDb}". Usá --skip-check si estás seguro.`
    );
  }

  await connectDb();

  const existing = await InmobiliariaModel.findOne({ name });
  if (existing) {
    throw new Error(`Ya existe una inmobiliaria llamada "${name}" (${existing._id}).`);
  }
  if (await AppUserModel.exists({ email })) {
    throw new Error(`Ya existe un usuario con el email ${email}.`);
  }

  const inmobiliaria = await InmobiliariaModel.create({
    name,
    legalName: args['legal-name']?.trim() ?? '',
    taxId: args['tax-id']?.trim() ?? '',
    phone: args.phone?.trim() ?? '',
    email: args['company-email']?.trim() ?? '',
    active: true,
  });

  try {
    const admin = await AppUserModel.create({
      firstName,
      lastName,
      name: `${firstName} ${lastName}`.trim(),
      email,
      role: 'admin',
      inmoviliariaId: inmobiliaria._id,
      phone: '',
      license: '',
      avatar: '',
      active: true,
      passwordHash: await bcrypt.hash(password, SALT_ROUNDS),
    });

    console.log(`[create:inmoviliaria] "${inmobiliaria.name}" creada (${inmobiliaria._id}).`);
    console.log(`[create:inmoviliaria] admin: ${admin.email} (${admin._id}).`);
    console.log('[create:inmoviliaria] puede entrar y dar de alta a sus asesores desde la app.');
  } catch (err) {
    // Se deshace la empresa para no dejar una inmobiliaria que nadie puede usar.
    await InmobiliariaModel.deleteOne({ _id: inmobiliaria._id });
    throw err instanceof ApiError
      ? new Error(err.message)
      : new Error(`No se pudo crear el administrador y se revirtió la empresa: ${String(err)}`);
  }

  await disconnectDb();
};

main().catch((err: unknown) => {
  console.error('[create:inmoviliaria] falló:', err instanceof Error ? err.message : err);
  process.exit(1);
});
