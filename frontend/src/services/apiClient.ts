export async function apiGet<T>(path: string, opts: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL as string
  const url = `${base}${path}`
  const headers = new Headers(opts.headers)

  // 現段階では使用しないが、将来の拡張のために保持
  // try {
  //   const { getIdToken } = await import('./auth')
  //   const token = await getIdToken()
  //   if (token) headers.set('Authorization', token)
  // } catch {}

  const res = await fetch(url, { ...opts, headers })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return res.json() as Promise<T>
}

export async function apiPost<T>(path: string, body: any, opts: RequestInit = {}): Promise<T> {
  const base = import.meta.env.VITE_API_BASE_URL as string;
  const res = await fetch(`${base}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", ...(opts.headers || {}) },
    body: JSON.stringify(body),
    ...opts,
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  // APIが空のレスポンスボディを返す場合もあるため、テキストをパースしてJSONに変換
  const text = await res.text();
  return (text ? JSON.parse(text) : ({} as T));
}