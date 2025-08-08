export async function apiGet<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const url = `${base}${path}`
  const headers = new Headers(opts.headers)

  try {
    const { getIdToken } = await import('./auth')
    const token = await getIdToken()
    if (token) headers.set('Authorization', token)
  } catch {}

  const res = await fetch(url, { ...opts, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}