# Pizza TOTAL maior, Regra dos 15 (apenas 13º/Férias/1/3) e Persistência por Usuário

## Visão geral
- Pizza TOTAL: card destacado e responsivo para os totais por verba.
- Regra dos 15: aplicada somente a 13º, férias proporcionais e 1/3 de férias; demais rubricas usam pró‑rata por dias/30.
- Persistência por usuário (Firestore) com fallback localStorage offline e sincronização posterior.

## Onde está
- Pizza TOTAL
  - `src/pages/Funcionarios.jsx` — usa `<EncargosPie variant="total" />` logo abaixo do título.
  - `src/components/EncargosPie.jsx` — aceita `variant` e aplica classes de layout.
  - `src/styles/components.css` — `.chart-card--total` e `.chart-area--tall` (altura `clamp(380px, 52vh, 720px)`).
- Regra dos 15
  - `src/calc/compute.js` — pipeline puro (13º/férias por ≥15 dias; salário/FGTS/INSS/IRRF por dias/30).
  - `src/pages/Funcionarios.jsx` — cálculo mensal exibido na UI: encargos por dias/30; provisões com regra dos 15.
  - Testes: `src/calc/compute.test.js`.
- Persistência por usuário
  - `src/layout/AppLayout.jsx` — faz subscribe por `uid` ao logar e atualiza o estado global.
  - `src/data/employees.js` — `subscribeEmployees`, `upsertEmployee` (localStorage fallback + Firestore).
  - `src/pages/Funcionarios.jsx` — chama `upsertEmployee` ao adicionar.

## Ajustes
- Brackets de INSS/IRRF: `src/calc/tables.js` (adicione faixas por ano conforme necessidade).
- Altura da pizza: ajuste `.chart-area--tall` em `src/styles/components.css`.
- Sincronização/erros: expanda `employees.js` para toasts/indicadores (opcional).

## Depuração rápida
- Datas: sempre criadas com `new Date(y, m, d)` (local), evitando bug 31/12.
- Persistência: verifique `users/{uid}/employees` no Firestore; sem rede, confira `localStorage` em `employees:{uid}`.
- Testes: `npm run test`.

