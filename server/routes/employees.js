import { Router } from 'express';
import { z } from 'zod';
import crypto from 'crypto';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { verifyIdToken } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';

const employeeSchema = z.object({
  id: z.string().optional(),
  nome: z.string().min(1),
  salarioMensalCentavos: z.number().int().nonnegative(),
  admissaoISO: z.string().refine((v) => !Number.isNaN(Date.parse(v)), 'admissaoISO inválida'),
  desligamentoISO: z.string().nullable().optional().refine((v) => v == null || !Number.isNaN(Date.parse(v)), 'desligamentoISO inválida'),
  ativo: z.boolean().optional(),
});

export const employeesRouter = Router();

// All /api/employees routes require auth
// TODO: Re-implement RBAC/role-based access control using Supabase roles
employeesRouter.use(verifyIdToken, requireActiveSubscription);

// GET /api/employees
employeesRouter.get('/', async (req, res) => {
  try {
    const userId = req.auth.uid;
    const { data, error } = await supabaseAdmin
      .from('employees')
      .select('id, data')
      .eq('user_id', userId);

    if (error) throw error;

    const items = data.map(item => ({ id: item.id, ...item.data }));
    return res.json({ items });
  } catch (e) {
    return res.status(500).json({ code: 'EMPLOYEES_LIST_FAILED', error: e.message });
  }
});

// POST /api/employees - create or update with dedupe
employeesRouter.post('/', async (req, res) => {
  try {
    const userId = req.auth.uid;
    const parse = employeeSchema.safeParse(req.body);
    if (!parse.success) {
      return res.status(400).json({ code: 'VALIDATION_FAILED', error: parse.error.flatten() });
    }
    const { nome, salarioMensalCentavos, admissaoISO } = parse.data;
    const desligamentoISO = parse.data.desligamentoISO ?? null;
    const adm = new Date(admissaoISO);
    const des = desligamentoISO ? new Date(desligamentoISO) : null;
    const now = new Date();
    if (adm > now) return res.status(400).json({ code: 'VALIDATION_FAILED', error: 'Data de admissão no futuro' });
    if (des && des < adm) return res.status(400).json({ code: 'VALIDATION_FAILED', error: 'Desligamento anterior à admissão' });

    // Use a hash of user ID and key fields for a stable, idempotent ID.
    const key = `${userId}::${nome.trim().toLowerCase()}::${admissaoISO}::${desligamentoISO || ''}`;
    const dedupeId = crypto.createHash('sha256').update(key).digest('hex').slice(0, 20);

    const employeeData = {
      nome: nome.trim(),
      salarioMensalCentavos,
      admissaoISO,
      desligamentoISO,
      ativo: !desligamentoISO,
      schemaVersion: 1,
    };

    const { data, error } = await supabaseAdmin
      .from('employees')
      .upsert({ 
        id: dedupeId, 
        user_id: userId,
        data: employeeData,
        updated_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;

    return res.status(200).json({ id: data.id, ...employeeData });
  } catch (e) {
    return res.status(500).json({ code: 'EMPLOYEE_CREATE_FAILED', error: e.message });
  }
});
