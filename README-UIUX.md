# UI/UX — Tema Gradiente Lavanda

Este refactor aplica um novo sistema de UI/UX com foco em acessibilidade (WCAG 2.2 AA), consistência visual e responsividade. A identidade visual é inspirada no pacote de fundos fornecido e inclui fallbacks puros em CSS quando necessário.

## Como testar localmente

- Requisitos: Node 18+
- Desenvolvimento: `npm run dev` (ou `npm run dev:full` para iniciar o servidor Express junto)
- Build: `npm run build` e `npm run preview`

Porta padrão: `8080` (conforme `vite.config.js`).

## Estrutura de arquivos

- `public/assets/ui/fundos/` — assets do zip descompactados (EPS/AI/JPG) e `index.json` de mapeamento.
- `src/styles/` — sistema de design
  - `tokens.css` — CSS variables do tema (cores, fontes, sombras, etc.)
  - `base.css` — reset/tipografia e regras de foco visível
  - `components.css` — botões, inputs, cards, tabela, modal, toasts
  - `layouts.css` — header, sidebar, grids e container
  - `_fundos.css` — classes utilitárias de background (assets + fallbacks)
- Componentes
  - `src/components/Header.jsx`, `Sidebar.jsx`, `Card.jsx`, `Button.jsx`, `Input.jsx`, `Select.jsx`, `DateField.jsx`, `Modal.jsx`, `Toast.jsx`, `Table.jsx`, `EmptyState.jsx`
- Páginas
  - `src/pages/Dashboard.jsx`, `Funcionarios.jsx`, `Relatorios.jsx`
- Layout
  - `src/layout/AppLayout.jsx` — header + sidebar + outlet

CSS global é importado em `src/main.jsx`.

## Fundos (assets e fallbacks)

- Arquivos extraídos: `public/assets/ui/fundos/5741174.jpg` (mesh), `5741172.eps`, `5741173.ai`.
- Mapeamento: `public/assets/ui/fundos/index.json`

Classes utilitárias:

- `.bg-mesh-01` — usa o JPG do pacote
- `.bg-noise` — overlay de ruído (data-URI, leve)
- `.bg-fallback-gradient` — gradiente radial+linear (CSS-only)
- `.header-gradient` — mistura de mesh + gradiente sutil para o header

Como trocar o fundo do header:

- Edite `src/styles/_fundos.css` na regra `.header-gradient` trocando a URL pelo asset desejado em `/assets/ui/fundos/...` ou aplique `.bg-fallback-gradient` quando quiser somente CSS.

## Tokens e Cores

Definidos em `src/styles/tokens.css`.

- Base: superfícies claras (branco + lavanda sutil)
- Acento primário: `--accent-500: #8B5CF6`
- Anéis de foco (`:focus-visible`): usam `--accent-400` e sombra expandida
Este projeto é exclusivamente light-mode (sem variações de dark mode).
Para ajustar o tema, altere as variáveis em `:root`.

## Componentes — Guia de uso

- `Button`: variantes `primary`, `secondary`, `ghost`, `destructive`
- `Input`, `Select`, `DateField`: labels sempre visíveis; mensagens via `hint`/`error`
- `Card`: superfícies com borda suave, raio e sombra
- `Table`: cabeçalho sticky, linhas com hover sutil
- `Modal`: `open`, `title`, `onClose`, `footer`
- `ToastStack` + `useToast()`: `push({ type, text, timeout })`

## Páginas e Layout

- Header translúcido com gradiente/mesh; ações (Assinar, Sair, tema)
- Sidebar com navegação para Dashboard, Funcionários e Relatórios
- Dashboard: KPIs + gráfico (composição) e barras por funcionário (Recharts)
- Funcionários: formulário validado + relatório mensal detalhado por funcionário
- Relatórios: exportação CSV/JSON agregada

## Acessibilidade

- Foco visível consistente (`:focus-visible` com anéis)
- Navegação por teclado completa
- Tipos e contrastes revisados, alvo AA
- `prefers-reduced-motion`: transições reduzidas

## Performance

- Fundos com `background-size: cover` e ruído leve
- CSS crítico enxuto; import único em `main.jsx`
- Recomenda-se otimizar imagens (gerar `.webp`/`.avif`) — manter os originais

## Extensão do sistema

- Para criar novos componentes, reusar tokens e classes utilitárias
- Adicionar variantes de botões ou estados em `components.css`
- Expandir a sidebar adicionando novas rotas sob `AppLayout`/React Router
