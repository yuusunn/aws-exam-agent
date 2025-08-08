import { Amplify } from 'aws-amplify'
import { fetchAuthSession, signIn, signOut } from 'aws-amplify/auth'

Amplify.configure({
  Auth: {
    Cognito: {
      userPoolId: import.meta.env.VITE_COGNITO_USER_POOL_ID,
      userPoolClientId: import.meta.env.VITE_COGNITO_CLIENT_ID,
      identityPoolId: import.meta.env.VITE_COGNITO_IDENTITY_POOL_ID, // 可選
      // 其他可選：signUpVerificationMethod、passwordFormat、loginWith 等
    }
  }
})

export async function login(username: string, password: string) {
  const res = await signIn({ username, password })
  localStorage.setItem('amplify-auth-user', '1')
  return res
}

export async function logout() {
  localStorage.removeItem('amplify-auth-user')
  await signOut()
}

export async function getIdToken(): Promise<string | null> {
  const session = await fetchAuthSession()
  return session.tokens?.idToken?.toString() ?? null
}

export function isSignedIn() {
  return !!localStorage.getItem('amplify-auth-user')
}