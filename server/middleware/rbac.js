import { supabaseAdmin } from '../supabaseAdmin.js';

// RBAC (Role-Based Access Control) middleware for Supabase.
// Checks if the authenticated user has at least one of the required roles.
export function rbac(requiredAnyRole = []) {
  return async function (req, res, next) {
    if (!requiredAnyRole || requiredAnyRole.length === 0) {
      return next();
    }

    const userId = req.auth?.uid;
    if (!userId) {
      return res.status(401).json({ code: 'AUTH_REQUIRED', error: 'Missing user' });
    }

    try {
      const { data: profile, error } = await supabaseAdmin
        .from('profiles')
        .select('roles')
        .eq('id', userId)
        .single();

      if (error) {
        throw new Error(`Failed to get user profile for RBAC check: ${error.message}`);
      }

      const userRoles = profile?.roles || {}; // Roles are expected to be a JSON object like { "OWNER": true }

      const hasPermission = requiredAnyRole.some(role => userRoles[role] === true);

      if (!hasPermission) {
        return res.status(403).json({ code: 'RBAC_DENIED', error: 'Insufficient permissions' });
      }

      return next();
    } catch (e) {
      return res.status(500).json({ code: 'RBAC_ERROR', error: e.message });
    }
  };
}
