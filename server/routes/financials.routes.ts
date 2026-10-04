import { Router } from 'express';
import { FinancialEntryModel } from '../models/FinancialEntry.js';
import { serializeEntry } from '../lib/serialize.js';
import { asyncHandler } from '../lib/http.js';
import { asEnum, asYmdDate } from '../lib/validation.js';
import { requireAuth, requireAdmin, scope } from '../middleware/auth.js';
import type { FinancialCategory, FinancialEntryType } from '../../src/types/index.js';

const ENTRY_TYPES: readonly FinancialEntryType[] = ['ingreso', 'egreso'];

const ENTRY_CATEGORIES: readonly FinancialCategory[] = [
  'Comisiones por Venta',
  'Comisiones por Alquiler',
  'Honorarios de Administración',
  'Marketing y Cartelería',
  'Sueldos y Cargas Sociales',
  'Alquileres y Servicios',
  'Tecnología y Software',
  'Impuestos y Tasas',
];

export const financialsRouter = Router();

// Los resultados financieros son visibles solo para el admin de la inmobiliaria
// (canViewFinancials). El filtro del dashboard es solo cosmético: los datos no
// salen de acá para un asesor.
financialsRouter.use(requireAuth, requireAdmin);

financialsRouter.get(
  '/',
  asyncHandler(async (req, res) => {
    const filter: Record<string, unknown> = { ...scope(req) };

    const type = req.query.type;
    if (typeof type === 'string' && type) {
      filter.type = asEnum<FinancialEntryType>(type, 'type', ENTRY_TYPES, { required: true });
    }

    const from = req.query.from;
    if (typeof from === 'string' && from) {
      filter.date = { ...(filter.date as object), $gte: asYmdDate(from, 'from', false) };
    }

    const to = req.query.to;
    if (typeof to === 'string' && to) {
      filter.date = { ...(filter.date as object), $lte: asYmdDate(to, 'to', false) };
    }

    const docs = await FinancialEntryModel.find(filter).sort({ date: -1 });
    res.json({ entries: docs.map(serializeEntry) });
  })
);