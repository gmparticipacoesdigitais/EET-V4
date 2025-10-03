import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { verifyIdToken } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { rbac } from '../middleware/rbac.js'; // New Supabase RBAC

const rolesSchema = z.object({
  uid: z.string().min(1),
  roles: z.object({ 
    OWNER: z.boolean().optional(), 
    ADMIN: z.boolean().optional(), 
    ANALYST: z.boolean().optional(), 
    VIEWER: z.boolean().optional() 
  }).passthrough(), // Allow other keys if needed
});

export const adminRouter = Router();

// Secure the admin routes: user must be authenticated, have a subscription, and be an OWNER.
adminRouter.use(verifyIdToken, requireActiveSubscription, rbac(['OWNER']));

// Set roles for a user
adminRouter.post('/roles', async (req, res) => {
  try {
    const parse = rolesSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ code: 'VALIDATION_FAILED', error: parse.error.flatten() });
    }
    
    const { uid, roles } = parse.data;

    // Ensure at least VIEWER role is set
    const newRoles = { VIEWER: true, ...roles };

    const { error } = await supabaseAdmin
      .from('profiles')
      .update({ roles: newRoles })
      .eq('id', uid);

    if (error) {
      // Handle case where user profile doesn't exist
      if (error.code === '22P02' || error.details.includes('(id)=')) { // Basic check for foreign key violation
        return res.status(404).json({ code: 'USER_NOT_FOUND', error: `User with ID ${uid} not found.` });
      }
      throw error;
    }

    return res.json({ ok: true, roles: newRoles });
  } catch (e) {
    return res.status(500).json({ code: 'ADMIN_ROLES_FAILED', error: e.message });
  }
});
