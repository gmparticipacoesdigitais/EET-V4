import { createRemoteJWKSet, jwtVerify } from 'jose';

let supabaseJwks = null;

function getSupabaseJWKS() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  if (!url) {
    console.error('Supabase URL is not configured. Cannot verify JWTs.');
    return null;
  }
  try {
    const jwksUrl = new URL('/auth/v1/keys', url).toString();
    supabaseJwks = createRemoteJWKSet(new URL(jwksUrl));
    return supabaseJwks;
  } catch (error) {
    console.error('Failed to create Supabase JWKS client:', error);
    return null;
  }
}

// Verify Supabase JWT passed via Authorization: Bearer <token>
export async function verifySupabaseToken(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const [, token] = header.split(' ');

    if (!token) {
      return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Missing bearer token' });
    }

    const jwks = supabaseJwks || getSupabaseJWKS();
    if (!jwks) {
      return res.status(503).json({ code: 'AUTH_UNAVAILABLE', error: 'Authentication service is not configured' });
    }

    const { payload } = await jwtVerify(token, jwks);
    
    const uid = payload.sub;
    if (!uid) {
        return res.status(401).json({ code: 'AUTH_INVALID', error: 'Invalid token: missing sub claim' });
    }

    const email = payload.email || null;
    req.auth = { uid, email, raw: payload };
    
    return next();
  } catch (e) {
    console.error('Token verification failed:', e.message);
    return res.status(401).json({ code: 'AUTH_INVALID', error: 'Invalid or expired token' });
  }
}

export const verifyIdToken = verifySupabaseToken;

export function errorHandler(err, req, res, _next) {
  const status = err.status || 500;
  const code = err.code || 'INTERNAL';
  const message = err.message || 'Unexpected error';
  return res.status(status).json({ code, error: message });
}

