import { Router } from 'express';
import { z } from 'zod';
import { supabaseAdmin } from '../supabaseAdmin.js';
import { verifyIdToken } from '../middleware/auth.js';
import { requireActiveSubscription } from '../middleware/subscription.js';
import { calcProgressive, prorata, roundCentsHalfUp, sha256Hex } from '../services/calc.js';

const inputSchema = z.object({
  employeeId: z.string().min(1),
  competencia: z.string().regex(/^\d{4}-\d{2}$/), // YYYY-MM
  override: z.object({ aliquotas: z.any().optional(), regrasProrata: z.any().optional() }).optional(),
});

export const calculationsRouter = Router();

// TODO: Re-implement RBAC
calculationsRouter.use(verifyIdToken, requireActiveSubscription);

calculationsRouter.post('/', async (req, res) => {
  try {
    const parse = inputSchema.safeParse(req.body);
    if (!parse.success) return res.status(400).json({ code: 'VALIDATION_FAILED', error: parse.error.flatten() });
    
    const { employeeId, competencia } = parse.data;
    const userId = req.auth.uid;

    const { data: employeeData, error: empError } = await supabaseAdmin
      .from('employees')
      .select('data')
      .eq('user_id', userId)
      .eq('id', employeeId)
      .single();

    if (empError) throw empError;
    if (!employeeData) return res.status(404).json({ code: 'NOT_FOUND', error: 'Employee not found' });

    const { data: settingsData, error: settingsError } = await supabaseAdmin
      .from('settings')
      .select('data')
      .eq('user_id', userId)
      .limit(1)
      .single(); // Assuming one settings doc per user

    if (settingsError && settingsError.code !== 'PGRST116') throw settingsError; // Ignore not found

    const employee = employeeData.data;
    const ano = Number(competencia.slice(0, 4));
    const settings = settingsData?.data || {};
    const aliquotasYear = parse.data.override?.aliquotas || (settings.aliquotas?.[String(ano)] || defaultAliquotas(ano));
    const regrasProrata = parse.data.override?.regrasProrata || settings.regrasProrata || { mesComercialDias: 30, regra15Dias: true };

    const parametrosSnapshot = {
      regrasProrata,
      aliquotas: aliquotasYear,
      fuso: process.env.APP_TIMEZONE || 'America/Fortaleza',
      arredondamento: 'halfUp2',
    };

    const calcKeySha256 = sha256Hex(`${userId}|${employeeId}|${competencia}|${sha256Hex(parametrosSnapshot)}`);
    const calcId = calcKeySha256.slice(0, 24);

    const { data: existing, error: existingError } = await supabaseAdmin
      .from('calculations')
      .select('id, data')
      .eq('id', calcId)
      .single();

    if (existingError && existingError.code !== 'PGRST116') throw existingError;
    if (existing) {
      return res.json({ id: existing.id, ...existing.data, idempotent: true });
    }

    const [y, m] = competencia.split('-').map((n) => parseInt(n, 10));
    const monthStart = new Date(Date.UTC(y, m - 1, 1));
    const nextMonth = new Date(Date.UTC(y, m, 1));
    const monthEnd = new Date(nextMonth.getTime() - 24 * 60 * 60 * 1000);
    const adm = new Date(employee.admissaoISO);
    const des = employee.desligamentoISO ? new Date(employee.desligamentoISO) : null;
    const start = adm > monthStart ? adm : monthStart;
    const end = des && des < monthEnd ? des : monthEnd;
    const daysWorked = Math.max(0, Math.min(30, Math.floor((end - start) / (24 * 60 * 60 * 1000)) + 1));

    const salaryMonthly = (employee.salarioMensalCentavos || 0) / 100;
    const salarioProrata = prorata(salaryMonthly, daysWorked);

    const fgtsRate = aliquotasYear.fgts ?? 0.08;
    const fgtsMes = salarioProrata * fgtsRate;

    const inssTable = aliquotasYear.inss?.tabela || [];
    const inss = calcProgressive(salarioProrata, inssTable);

    const irpfTable = aliquotasYear.irpf?.tabela || [];
    let irpf = calcProgressive(Math.max(0, salarioProrata - (aliquotasYear.irpf?.deducaoPadrao || 0)), irpfTable);

    const mesCompleto = regrasProrata.regra15Dias ? daysWorked >= 15 : (daysWorked >= 1);
    const decimoTerceiroProporcional = mesCompleto ? salaryMonthly / 12 : 0;
    const feriasProporcionais = mesCompleto ? salaryMonthly / 12 : 0;
    const umTercoFerias = mesCompleto ? feriasProporcionais / 3 : 0;

    const avisoPrevioIndenizado = 0;
    const multaFgts40 = fgtsMes * 0.4;

    const results = {
      salarioProrataCentavos: roundCentsHalfUp(salarioProrata),
      fgtsMesCentavos: roundCentsHalfUp(fgtsMes),
      inssCentavos: roundCentsHalfUp(inss),
      irpfCentavos: roundCentsHalfUp(irpf),
      decimoTerceiroProporcionalCentavos: roundCentsHalfUp(decimoTerceiroProporcional),
      feriasProporcionaisCentavos: roundCentsHalfUp(feriasProporcionais),
      umTercoFeriasCentavos: roundCentsHalfUp(umTercoFerias),
      rescisao: {
        avisoPrevioIndenizadoCentavos: roundCentsHalfUp(avisoPrevioIndenizado),
        multaFgts40Centavos: roundCentsHalfUp(multaFgts40),
      },
    };

    const totais = (() => {
      const bruto = results.salarioProrataCentavos + results.decimoTerceiroProporcionalCentavos + results.feriasProporcionaisCentavos + results.umTercoFeriasCentavos;
      const descontos = results.inssCentavos + results.irpfCentavos;
      const liquido = Math.max(0, bruto - descontos);
      return { brutoCentavos: bruto, descontosCentavos: descontos, liquidoCentavos: liquido };
    })();

    const doc = {
      employeeId,
      competencia,
      parametrosSnapshot,
      entradas: {
        salarioMensalCentavos: employee.salarioMensalCentavos,
        admissaoISO: employee.admissaoISO,
        desligamentoISO: employee.desligamentoISO ?? null,
      },
      resultados: { ...results, totais },
      hashes: { calcKeySha256 },
      createdByUid: req.auth.uid,
      schemaVersion: 1,
    };

    const { error: calcError } = await supabaseAdmin.from('calculations').upsert({ id: calcId, user_id: userId, data: doc, created_at: new Date().toISOString() });
    if (calcError) throw calcError;

    const auditLog = {
      actorUid: req.auth.uid,
      action: 'create',
      entity: 'calculation',
      entityId: calcId,
      after: doc,
    };
    const { error: auditError } = await supabaseAdmin.from('audit_logs').insert({ user_id: userId, data: auditLog });
    if (auditError) console.error('Failed to write audit log:', auditError.message); // Non-critical, just log

    return res.status(201).json({ id: calcId, ...doc });
  } catch (e) {
    console.error('calculations error', e);
    return res.status(500).json({ code: 'CALCULATION_FAILED', error: e.message });
  }
});

function defaultAliquotas(ano) {
  const inss = {
    tabela: [
      { upTo: 1412, rate: 0.075 },
      { upTo: 2666.68, rate: 0.09 },
      { upTo: 4000.03, rate: 0.12 },
      { upTo: 7786.02, rate: 0.14 },
    ],
  };
  const irpf = {
    deducaoPadrao: 0,
    tabela: [
      { upTo: 2259.20, rate: 0 },
      { upTo: 2826.65, rate: 0.075 },
      { upTo: 3751.05, rate: 0.15 },
      { upTo: 4664.68, rate: 0.225 },
      { upTo: Infinity, rate: 0.275 },
    ],
  };
  return { ano, fgts: 0.08, inss, irpf };
}
