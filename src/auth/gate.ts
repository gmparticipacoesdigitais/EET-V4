import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../lib/firebase';

/** Route guard. Without user → go to /login. With user → call onReady(uid). */
export function mountAuthGate(onReady: (uid: string) => void): void {
  onAuthStateChanged(auth, async (user) => {
    if (!user) {
      // Avoid redirect loop if already on login page
      const isOnLogin = location.pathname.endsWith('/login.html') || location.pathname === '/login.html'
      if (!isOnLogin) location.assign('/login.html')
      return;
    }
    onReady(user.uid);
  });
}
