# UI/UX Cleanup — Remoção de figura, CTA “Assinar” harmonizado e polimento (Light-only)

## O que foi feito
- Removida a figura/arte “UI/UX” do topo do app (Hero) e quaisquer `url()` que apontavam para os assets gráficos nos estilos usados.
- Substituída por um gradiente leve lavanda (classe `hero-light-lavender`), preservando contraste e legibilidade.
- Padronizado o botão “Assinar” com o sistema de botões (`.btn .btn-primary`) e adicionado `aria-label`.
- Removido o subtítulo “cálculos e relatórios” abaixo do nome do app no header e ajustado o espaçamento.
- Tema permanece exclusivamente LIGHT; z-index e containers seguem a padronização para evitar sobreposições.

## Onde alterar no futuro
- Hero/gradiente: `src/styles/layouts.css` (classe `.hero-light-lavender`).
- Header/título: `src/components/Header.jsx`.
- CTA “Assinar”: `src/components/CheckoutButton.jsx`.
- Utilitários de fundos: `src/styles/_fundos.css` (nenhuma referência a imagens decorativas).

## Boas práticas mantidas
- Acessibilidade: foco visível, contrastes AA, `aria-label` em CTAs.
- Responsividade: layout flexível, sem imagens decorativas pesadas.
- Z-Index: header 100, dropdown 200, tooltip 300, modal 1000, toast 1100 (variáveis em tokens).

## Verificações
- Não há “cálculos e relatórios” no header.
- Nenhuma referência CSS/DOM aos arquivos de arte removidos.
- Botão “Assinar” segue `btn btn-primary` com altura mínima 44px.

