# Cálculos por Datas + Pie Global (Light-only)

## O que foi adicionado
- Datas visíveis no cadastro/edição com badges de conferência (interpretação interna local, sem UTC).
- Gráfico global “por verba” (pizza/doughnut) consolidando todos os funcionários.
- Núcleo de cálculos revisado com funções puras e datas `date-only` locais para evitar o bug 31/12.

## Pastas e arquivos
- `src/calc/date.js`: utilitários de datas (`parseDMY`, `parseYMD`, `workedDaysInMonth`, etc.).
- `src/calc/tables.js`: esqueleto de tabelas progressivas (INSS/IRRF) por ano e `applyProgressiveTable`.
- `src/calc/compute.js`: `calcularFuncionario` (totais por verba) e `aggregateByVerba`.
- `src/pages/Funcionarios.jsx`: badges de data, validações, cálculo consolidado por funcionário, pie global reativo.
- Testes: `src/calc/compute.test.js` (Vitest) cobrindo cenários de datas e pró‑rata.

## Como funciona
- Inputs de data (HTML `type=date`) produzem `YYYY-MM-DD`. Usamos `parseYMD` para criar `Date(y, m, d)` local, evitando deslocamentos.
- O pipeline de cálculo soma salário pró‑rata mês a mês (mês comercial de 30 dias para frações), FGTS (8%), 13º por meses com ≥15 dias, férias proporcionais + 1/3 no período aquisitivo corrente. INSS/IRRF usam tabelas parametrizáveis se fornecidas (senão retornam 0).
- O gráfico global é alimentado por `aggregateByVerba(funcionarios)` e atualiza quando a lista muda.

## Acessibilidade e UI
- Badges usam `aria-live="polite"` para refletir mudanças nas datas.
- Tooltip (atributo `title`) nas datas da listagem informa o timezone: “America/Fortaleza — data sem horas (00:00 local)”.
- Tema exclusivamente light; componentes seguem tokens do design system.

## Como estender
- Forneça tabelas INSS/IRRF por ano em `src/calc/tables.js` via `TABELA_INSS[yyyy]` e `TABELA_IRRF[yyyy]` (faixas com `upTo`, `rate` e opcional `deduct`).
- Adapte regras especiais de rescisão (multa 40% FGTS, aviso prévio) no retorno de `calcularFuncionario` se necessário.

## Executar testes
- `npm run test` (Vitest). Verifica parsing local e cenários de pró‑rata.

