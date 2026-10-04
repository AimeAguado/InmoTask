/**
 * Importa las propiedades del PDF de captación a MongoDB.
 *
 *   npm run import:properties            # upsert real
 *   npm run import:properties -- --dry-run
 *
 * El dataset es server/data/captacion.json: 34 inmuebles ya cruzados con las
 * carpetas de Drive de las que se bajaron las fotos a public/properties/.
 *
 * Es NO destructivo a propósito: hace upsert por `code`, así que correrlo de
 * nuevo actualiza las fichas en lugar de duplicarlas ni borrar el resto. No
 * toca tasks ni financialentries. Lo que sí borra son las fichas INM-30xx que
 * "captacion" de importaciones anteriores que ya no están en el dataset (por
 * ejemplo si se saca una propiedad de la planilla).
 *
 * A diferencia de server/seed.ts, este script no se niega a correr si la base
 * está vacía: es una carga de datos real, no una demo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import mongoose from 'mongoose';
import { connectDb, disconnectDb } from './db';
import { config } from './config';
import { PropertyModel } from './models/Property';
import { CURRENT_AGENT } from '../src/data/mockData';
import type { Currency, PropertyType } from '../src/types';

const DRY_RUN = process.argv.includes('--dry-run');
const DATA_FILE = path.join(path.dirname(fileURLToPath(import.meta.url)), 'data', 'captacion.json');

/** Las fichas de captación se marcan con esto; el barrido de huérfanos usa el
 *  marcador y no el código, para no tocar nada cargado a mano. */
const SOURCE = 'captacion';

interface CaptacionRow {
  code: string;
  folder: string;
  folderName: string;
  match: string;
  imageCount: number;
  title: string;
  type: PropertyType;
  operation: 'Venta' | 'Alquiler';
  status: 'disponible';
  address: string;
  neighborhood: string;
  city: string;
  coveredArea: number;
  totalArea: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpots: number;
  keysLocation: 'Oficina Central';
  signageStatus: 'Cartel Colocado' | 'Sin Cartel' | 'Pendiente de Colocación';
  imageUrl: string;
  images: string[];
  description: string;
  price: number;
  currency: Currency;
  services: string;
  aptaCredito: boolean;
  financing: string;
  active: boolean;
  signagePlaced: boolean;
  source: string;
  featured: boolean;
  tags: string[];
}

/** Los _id y createdAt los pone Mongo; el resto sale del dataset tal cual. */
const toDoc = (row: CaptacionRow) => {
  const { folder, folderName, match, imageCount, ...doc } = row;
  return { ...doc, assignedAgent: CURRENT_AGENT };
};

const main = async () => {
  if (!fs.existsSync(DATA_FILE)) {
    throw new Error(`No se encontró el dataset en ${DATA_FILE}`);
  }

  const rows = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8')) as CaptacionRow[];

  const problems = rows.filter(
    (r) => !r.imageUrl || !r.description || !r.type || !r.operation || !r.city
  );
  if (problems.length) {
    throw new Error(
      `Filas sin foto, descripción, tipo, operación o ciudad: ${problems
        .map((p) => p.code)
        .join(', ')}`
    );
  }

  const codes = new Set(rows.map((r) => r.code));
  if (codes.size !== rows.length) {
    throw new Error('Hay códigos repetidos en el dataset; el upsert sería ambiguo.');
  }

  console.log(`Base destino: ${config.mongoDb}`);
  console.log(`Dataset: ${rows.length} inmuebles (${DRY_RUN ? 'DRY RUN, no se escribe' : 'se escribe'})`);
  if (DRY_RUN) {
    const byType = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.type] = (acc[r.type] ?? 0) + 1;
      return acc;
    }, {});
    console.log('  por tipo:', Object.entries(byType).map(([k, v]) => `${k}=${v}`).join(', '));
    const byOp = rows.reduce<Record<string, number>>((acc, r) => {
      acc[r.operation] = (acc[r.operation] ?? 0) + 1;
      return acc;
    }, {});
    console.log('  por operación:', Object.entries(byOp).map(([k, v]) => `${k}=${v}`).join(', '));
    console.log('  con precio:', rows.filter((r) => r.price > 0).length);
    console.log('  fotos referenciadas:', rows.reduce((a, r) => a + r.images.length, 0));
  }

  await connectDb();

  const total = await PropertyModel.countDocuments();
  if (!total && !DRY_RUN) {
    console.log('La base no tiene properties; se va a crear la primera ficha.');
  }

  const existing = await PropertyModel.find({ code: { $in: rows.map((r) => r.code) } })
    .select('code')
    .lean();
  const existingCodes = new Set(existing.map((e) => e.code));

  // Fichas de importaciones anteriores que ya no están en la planilla.
  const orphans = await PropertyModel.find({ source: SOURCE }).select('code').lean();
  const removed = orphans.map((o) => o.code).filter((c) => !codes.has(c));

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    if (DRY_RUN) {
      if (existingCodes.has(row.code)) updated++;
      else created++;
      continue;
    }
    await PropertyModel.updateOne(
      { code: row.code },
      { $set: toDoc(row) },
      { upsert: true }
    );
    if (existingCodes.has(row.code)) updated++;
    else created++;
  }

  if (removed.length && !DRY_RUN) {
    await PropertyModel.deleteMany({ code: { $in: removed } });
  }

  const summary = [
    `nuevas: ${created}`,
    `actualizadas: ${updated}`,
    `fuera de la planilla: ${removed.length}`,
  ].join(' | ');
  console.log(DRY_RUN ? `[dry-run] ${summary}` : `Importado. ${summary}`);

  if (removed.length) {
    console.log(`  retiré: ${removed.join(', ')}`);
  }

  if (!DRY_RUN) {
    const final = await PropertyModel.countDocuments({ source: SOURCE });
    console.log(`Total de Properties importadas en la base: ${final}`);
  }

  await disconnectDb();
};

main().catch(async (err) => {
  console.error('Falló la importación:', err instanceof Error ? err.message : err);
  if (mongoose.connection.readyState !== 0) await disconnectDb();
  process.exit(1);
});