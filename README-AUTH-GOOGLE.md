# Google Auth (legacy)\n\n> [!NOTE]\n> Fluxo de login com Google descontinuado na interface atual (setembro/2025). Este guia permanece apenas como historico.\n\nGoogle Login — Firebase Auth v9 (popup → redirect fallback)

Resumo
- Login com Google restaurado via Firebase Auth (Web v9 modular).
- Fallback automático popup → redirect para ambientes com popup bloqueado/ITP.
- Gate real via `/api/bootstrap` antes de renderizar o dashboard.
- CORS configurável por env e pronto para cookies se necessário.
- Tema light preservado e botão “Entrar com Google” ativo.

1) Triagem Rápida
- Abra DevTools (Console/Network) e tente logar. Erros comuns:
  - idpiframe_initialization_failed, popup_closed_by_user, origin_mismatch,
    redirect_uri_mismatch, invalid_client, access blocked,
    cookie “SameSite”, accounts.google.com refused to connect, CORS.
- Confirme a porta do app (ex.: http://localhost:5173 com Vite, http://localhost:8080 para o server).

2) Firebase Auth (recomendado)
2.1 Dependências
  - Já presentes: `firebase` (cliente) e `firebase-admin` (server).

2.2 Variáveis (.env.local — FRONT, sem segredos)
  - VITE_FIREBASE_API_KEY=...
  - VITE_FIREBASE_AUTH_DOMAIN=seu-projeto.firebaseapp.com
  - VITE_FIREBASE_PROJECT_ID=...
  - VITE_FIREBASE_APP_ID=...
  - (opcionais: VITE_FIREBASE_STORAGE_BUCKET, VITE_FIREBASE_MESSAGING_SENDER_ID, VITE_FIREBASE_MEASUREMENT_ID)

2.3 Inicialização
- Código em `src/firebase.js` inicializa App/Auth/Firestore e define `googleProvider.setCustomParameters({ prompt: 'select_account' })`.

2.4 Tela de login (popup → redirect fallback)
- O botão “Entrar com Google” chama `loginWithGoogle()` (Firebase popup) e, se falhar por popup bloqueado/ITP/domínio, cai em `signInWithRedirect` automaticamente.
- `src/pages/AuthPage.jsx` chama `getRedirectResult(auth)` na montagem para finalizar o ciclo redirect.

2.5 Firebase Console → Authentication → Settings
- Authorized domains: adicione todos os hosts (dev/prod):
  - localhost, 127.0.0.1, e o seu domínio público.

3) Gate Real — /api/bootstrap
- O front só renderiza o dashboard após validar no back.
- `src/auth/AuthGate.jsx` pega o ID token, chama `/api/session/ensure` (sincroniza claims) e então `/api/bootstrap`.
- Se Stripe estiver configurado, `/api/bootstrap` também retorna o estado da assinatura; caso contrário, o server responde `{ subscription: { active: false, status: 'none' } }`.

4) Origens/Redirect URIs/Consent Screen
- Para Firebase Auth (Google provider): use Authorized domains (não exige redirect URIs fixos no GCP quando usando fluxo do Firebase).
- Caso use GIS direto (alternativa):
  - Authorized JavaScript origins (exatos):
    - http://localhost:8080, http://127.0.0.1:8080, http://localhost:5173, https://SEU_DOMINIO
  - Authorized redirect URIs (se houver redirect handler próprio):
    - http://localhost:8080/auth/callback, https://SEU_DOMINIO/auth/callback
- Consent Screen: se “Testing”, adicionar test users; em “Production”, revisar escopos aprovados.

5) Cookies/Sessão e CORS
- Fluxo atual usa Authorization Bearer (ID token Firebase) — não dependemos de cookies para autenticação.
- Se futuramente usar sessão httpOnly:
  - Dev (HTTP): SameSite=Lax, sem Secure.
  - Prod (HTTPS cross-site): SameSite=None; Secure.
  - Sempre HttpOnly.
- CORS
  - Server aceita `CORS_ALLOW_ORIGINS` (lista separada por vírgula). Se definido, só permite origens listadas e `credentials:true`.
  - Se não definido, comportamento permissivo em dev (reflect origin), com `credentials:true` preparado para cookies.

6) QA — Critérios de Aceite
- Impossível acessar `/`/dashboard sem autenticação verificada no backend (401 em `/api/bootstrap` → redirect para `/login`).
- Login Google funciona em dev e prod. Se popup for bloqueado, redirect conclui login.
- Sem erros de origem/redirect/cookies nos flows comuns.
- Assinatura: se ativa, segue ao dashboard; caso contrário, redireciona para `/subscribe` (quando Stripe estiver configurado).

7) Dicas para Erros Comuns
- origin_mismatch / redirect_uri_mismatch: cheque o host/porta atual e os domínios autorizados no Firebase Auth (e GCP se usando GIS direto).
- idpiframe_initialization_failed: inclua `localhost`/`127.0.0.1` nos Authorized domains.
- Popup bloqueado: use o redirect automático (já implementado) ou disponibilize um botão “Tentar via redirecionamento”.


