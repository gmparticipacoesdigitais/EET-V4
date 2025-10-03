# UI/UX — Tipografia, Hero limpo, Logout visível e Tela de Autenticação (Light-only)

Este documento descreve como manter os ajustes de tipografia, a “figura superior” (hero) organizada, o botão de “Sair” e a tela de autenticação, tudo em tema exclusivamente LIGHT.

## Onde editar
- Tokens e tipografia: `src/styles/tokens.css`
  - Escala fluída (`--title-size`, `--subtitle-size`, `--body-size`) e pesos (`--fw-*`).
  - Z-index unificado (`--z-header`, `--z-dropdown`, `--z-tooltip`, `--z-modal`, `--z-toast`).
- Base e utilitários: `src/styles/base.css`
  - Cabeçalhos, `caption`, `text-soft`, `text-ellipsis`.
- Componentes e camadas: `src/styles/components.css`
  - Botões, cards, tabelas (thead sticky), modal/toast, gráficos.
- Layouts: `src/styles/layouts.css`
  - Header sticky, Sidebar drawer <1200px, `.hero`, `.auth-page`, `.auth-card`.
- Hero: `src/components/Hero.jsx`
- Header/Logout: `src/components/Header.jsx` (botão “Sair (encerrar sessão)”) 
- Autenticação: `src/pages/AuthPage.jsx` (cartão central, botão Google)

## Tipografia — recomendações
- Altere apenas variáveis em `tokens.css` para manter consistência.
- Linhas: `--lh-tight` para títulos; `--lh-normal` para corpo; `--lh-relaxed` para captions.
- Foco visível já padronizado em `base.css`.

## Hero (figura superior)
- Classe `.hero` aplica gradiente sutil + overlay de ruído muito leve.
- O conteúdo do hero é definido por rota em `Hero.jsx` (title/subtitle).
- Mantenha o texto curto para não quebrar em telas estreitas.

## Logout
- O botão “Sair” no header chama `logout()` do contexto de auth e o `ProtectedRoute` redireciona para `/login` quando não há usuário.
- Acessibilidade: `aria-label="Sair (encerrar sessão)"`.

## Autenticação
- Layout com `.auth-page` e `.auth-card` para visual clean, coerente com o tema LIGHT.
- `GoogleButton` integra com o fluxo atual; estados de erro em `.caption` com `--danger`.

## Capturas e build
- Build: `npm run build` (saída em `dist/`).
- Para gerar um ZIP do build: compacte a pasta `dist/`.
- Recomenda-se capturar 3 prints: (1) Header + hero (Dashboard), (2) Dashboard com gráficos/tabela, (3) Tela de autenticação.

## Acessibilidade
- Contraste AA validado nas superfícies claras.
- Navegação por teclado; `:focus-visible` evidente.
- `prefers-reduced-motion` reduz transições.

