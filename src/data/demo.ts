/**
 * Credenciales y datos del modo demo. Son públicos por diseño (aparecen en la
 * pantalla de login para que cualquiera pueda probar), así que van en un único
 * lugar compartido entre el front (que las muestra) y server/demo.ts (que crea
 * los usuarios en la base con `npm run seed:demo`).
 */
export const DEMO = {
  inmobiliaria: 'InmoTask Demo',
  /** Administradora: ve todo, incluida la gestión de usuarios. */
  admin: {
    email: 'demo@inmotask.com',
    password: 'demo1234',
    firstName: 'Demo',
    lastName: 'Inmobiliaria',
    title: 'Cuenta demo (administradora)',
  },
  /** Asesor: acceso operativo completo de la misma inmobiliaria demo. */
  asesor: {
    email: 'asesor@inmotask.com',
    password: 'asesor123',
    firstName: 'Prueba',
    lastName: 'Asesor',
    title: 'Cuenta demo (asesora)',
  },
} as const;