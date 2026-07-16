export async function clientFetch<T>(path: string, options: RequestInit = {}): Promise<T | null> {
  try {
    const url = path.startsWith('/api/')
      ? path
      : `/api/backend${path.startsWith('/') ? path : `/${path}`}`
    const res = await fetch(url, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    })

    if (!res.ok) {
      return null
    }

    if (res.status === 204) {
      return null
    }

    return res.json()
  } catch (error) {
    return null
  }
}
