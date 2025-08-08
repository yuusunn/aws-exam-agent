import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { isSignedIn } from '../services/auth'

export default function Guard({ children }: { children: ReactNode }) {
  return isSignedIn() ? children : <Navigate to="/" replace />
}