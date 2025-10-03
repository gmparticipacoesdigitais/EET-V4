let gsiLoading = null

export function loadGoogleIdentity() {
  if (window.google && window.google.accounts && window.google.accounts.id) return Promise.resolve()
  if (gsiLoading) return gsiLoading
  gsiLoading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://accounts.google.com/gsi/client'
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = (e) => reject(e)
    document.head.appendChild(script)
  })
  return gsiLoading
}

export function decodeJwt(token) {
  try {
    const [, payload] = token.split('.')
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(decodeURIComponent(escape(json)))
  } catch {
    return null
  }
}

export async function googleSignInWithIdToken(clientId) {
  await loadGoogleIdentity()
  return new Promise((resolve, reject) => {
    if (!window.google?.accounts?.id) return reject(new Error('Google Identity não disponível'))
    let resolved = false
    window.google.accounts.id.initialize({
      client_id: clientId,
      callback: (response) => {
        resolved = true
        const payload = decodeJwt(response.credential)
        if (!payload) return reject(new Error('Token inválido'))
        resolve({
          id: payload.sub,
          email: payload.email,
          name: payload.name,
          picture: payload.picture,
          payload,
          idToken: response.credential,
        })
      },
      auto_select: false,
      cancel_on_tap_outside: true,
      itp_support: true,
    })
    // Trigger prompt. User will see One Tap or account chooser.
    window.google.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        if (!resolved) reject(new Error('Login do Google cancelado'))
      }
    })
  })
}

