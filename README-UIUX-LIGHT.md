# UI/UX — Tema Light-Only + Correção de Sobreposições

Este refactor torna a UI exclusivamente LIGHT (sem dark mode), padroniza tokens, corrige camadas (z-index) e garante que nenhum elemento se sobreponha indevidamente (cards, gráficos, tooltips, modais, toasts, dropdowns).

## Como visualizar
- Dev: `npm run dev` (porta 8080 padrão)
- Build/preview: `npm run build && npm run preview`

## Onde ficam os tokens e estilos
- `src/styles/tokens.css` — paleta light, tipografia, espaçamentos, sombras e escala de z-index.
- `src/styles/base.css` — reset, tipografia, foco visível, utilitários (`.container`, `.text-ellipsis`).
- `src/styles/components.css` — botões, inputs, cards, tabela, modal, toasts, gráficos.
- `src/styles/layouts.css` — header/sidebars, grids responsivos e container principal.
- `src/styles/_fundos.css` — utilitários de fundos (gradientes e overlay de noise sutil).

CSS global é importado em `src/main.jsx`.

## Fundos/Gradientes (legibilidade primeiro)
- Assets do pacote estão em `public/assets/ui/fundos/` e mapeados em `public/assets/ui/fundos/index.json`.
- Use classes:
  - `.bg-sutil` — gradiente leve para a página (texto sempre legível).
  - `.bg-mesh-01` — usa o JPG do pacote (não em cartões de conteúdo).
  - `.bg-noise` — overlay de ruído (opacidade ≤ 0.15; `mix-blend-mode: overlay`).
  - `.header-gradient` — gradiente/mesh suave para o header.

Para trocar o fundo do header, edite a regra `.header-gradient` em `src/styles/_fundos.css`.

## Escala de Z-Index (evita sobreposição errada)
Declarada em `tokens.css`:
- `--z-base`: 0 (conteúdo padrão)
- `--z-raised`: 10 (cards)
- `--z-header`: 100 (header/sidebar)
- `--z-dropdown`: 200 (menus)
- `--z-tooltip`: 300 (tooltips)
- `--z-modal`: 1000 (modais)
- `--z-toast`: 1100 (toasts)

Componentes usam essas variáveis; evite valores hardcoded.

## Tipografia e clamps
- `--title-size`: `clamp(18px, 1.2vw + 16px, 28px)`
- `--body-size`: `clamp(14px, 0.4vw + 13px, 18px)`
- Cabeçalhos `h1/h2/h3` usam `--title-size`; parágrafos e tabelas usam `--body-size`.

## Gráficos (sem overlap)
- Cartões de gráficos usam `.chart-card` (altura mínima) e `.chart-area` (canvas absolutizado). 
- Recharts tooltip tem `z-index: var(--z-tooltip)` para ficar acima do canvas.
- Tabelas grandes usam `.table-wrap` com cabeçalho `sticky` (sem cobrir conteúdo).

## Somente Light Mode
- Removidos: toggles, classes `.dark`, `prefers-color-scheme`, persistência `localStorage` de tema.
- O aplicativo opera apenas com os tokens de `:root`.

## Ajustes rápidos
- Para alterar cores/contraste: edite `src/styles/tokens.css`.
- Para mudar altura dos gráficos: edite `.chart-card`/`.chart-area` em `components.css`.
- Para responsividade de grids (2 colunas → 1): ajuste media queries em `layouts.css`.

## Acessibilidade
- Foco visível consistente com anéis (`:focus-visible`).
- Redução de movimento com `prefers-reduced-motion`.
- Contraste AA checado nas superfícies básicas.

## Checklist light-only
- Sem `@media (prefers-color-scheme: dark)`.
- Sem `.dark` ou toggle de tema.
- Tokens unificados em `:root`.
- Nenhum acesso a `localStorage` para tema.

