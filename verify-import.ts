import fs from 'node:fs';
import path from 'node:path';
import { connectDb, disconnectDb } from './server/db';
import { PropertyModel } from './server/models/Property';
import { TaskModel } from './server/models/Task';
import { AppUserModel } from './server/models/AppUser';

const PUB = 'C:/Users/Aimen/workspaces/InmoTask/public';

await connectDb();

const total = await PropertyModel.countDocuments();
const cap = await PropertyModel.find({ source: 'captacion' });
const manual = await PropertyModel.find({ source: { $ne: 'captacion' } });

console.log(`Properties totales: ${total} | importadas: ${cap.length} | manuales/seed: ${manual.length}`);
console.log('códigos manuales:', manual.map((m) => m.code).sort().join(', '));

console.log(
  'otras colecciones (intactas):',
  [
    ['tasks', await TaskModel.countDocuments()],
    ['appusers', await AppUserModel.countDocuments()],
  ]
    .map(([n, c]) => `${n}=${c}`)
    .join(' ')
);

// Cada imagen referenciada tiene que existir en public/
let faltan = 0;
let verificadas = 0;
const rutasFaltantes = new Set();
for (const p of cap) {
  for (const img of p.images) {
    const abs = path.join(PUB, img.replace(/^\//, ''));
    if (fs.existsSync(abs) && fs.statSync(abs).size > 1024) verificadas++;
    else { faltan++; rutasFaltantes.add(img); }
  }
}
console.log(`fotos en disco: ${verificadas} verificadas | ${faltan} faltantes`);
if (rutasFaltantes.size) console.log('  faltan:', [...rutasFaltantes].slice(0, 8).join(', '));

console.log(`\nsin foto: ${cap.filter((p) => !p.imageUrl).length}`);
console.log(`sin descripción: ${cap.filter((p) => !p.description.trim()).length}`);
console.log(`sin precio: ${cap.filter((p) => !p.price).length}`);

const muestra = await PropertyModel.findOne({ code: 'INM-6034' }).lean();
if (!muestra) {
  console.log('\nejemplo INM-6034: no encontrado');
} else {
  console.log('\nejemplo INM-6034:');
  console.log(JSON.stringify({
    code: muestra.code, title: muestra.title, type: muestra.type, operation: muestra.operation,
    city: muestra.city, price: `${muestra.currency} ${muestra.price}`, images: muestra.images.length,
    imageUrl: muestra.imageUrl, source: muestra.source,
    description: muestra.description,
  }, null, 1));
}

await disconnectDb();