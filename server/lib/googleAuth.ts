import { OAuth2Client } from 'google-auth-library';
import { config } from '../config.js';
import { ApiError } from './http.js';

/**
 * Verificador del id_token que manda el navegador con "Continuar con Google".
 *
 * El flujo es ida y vuelta con Google: el front recibe el token de Google
 * Identity Services y acá se valida la firma, el público (aud) y la expiración
 * antes de confiar en el email. NUNCA se confía en un email que mande el cliente.
 */
const client = new OAuth2Client(config.googleClientId);

export interface GoogleVerifiedEmail {
  email: string;
}

export const verifyGoogleCredential = async (credential: string): Promise<GoogleVerifiedEmail> => {
  if (!config.googleClientId) {
    throw ApiError.serviceUnavailable(
      'google-not-configured',
      'El login con Google no está configurado en este servidor.'
    );
  }

  try {
    const ticket = await client.verifyIdToken({
      idToken: credential,
      audience: config.googleClientId,
    });
    const payload = ticket.getPayload();

    // El email tiene que venir verificado por Google: sin esa garantía, alguien
    // podría registrar un email ajeno y pedir una cuenta con él.
    if (!payload?.email || !payload.email_verified) {
      throw ApiError.unauthorized(
        'google-email-unverified',
        'El email de Google no está verificado.'
      );
    }

    return { email: payload.email.toLowerCase() };
  } catch (err) {
    if (err instanceof ApiError) throw err;
    // verifyIdToken también falla si el token está vencido o firmado por Google
    // con otro client_id; en ambos casos es un dato inválido, no un problema del
    // servidor.
    throw ApiError.badRequest('invalid-google-token', 'El token de Google no es válido.');
  }
};