import { auth } from '../firebase'

/**
 * Sign out of Firebase (legacy support) and send user to the login screen.
 */
export async function logoutToLogin(): Promise<void> {
  try {
    await auth?.signOut?.()
  } catch (error) {
    console.error('[auth] logout error', error)
  } finally {
    try {
      window.location.assign('/login.html')
    } catch (navigationError) {
      console.error('[auth] redirect error', navigationError)
    }
  }
}
