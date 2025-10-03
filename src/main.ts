import { mountAuthGate } from './auth/gate';
import { assertEnv, ensureAuthPersistence } from './lib/firebase';

/** Boot */
(async () => {
  assertEnv();
  await ensureAuthPersistence();

  mountAuthGate((uid) => {
    const root = document.getElementById('app')!;
    root.innerHTML = `
      <h1>Bem-vindo, ${uid}</h1>
      <button id="sair" aria-label="Sair">Sair</button>
    `;
    import('./auth/login').then(({ logoutToLogin }) => {
      document.getElementById('sair')!.addEventListener('click', logoutToLogin);
    });
  });
})();

