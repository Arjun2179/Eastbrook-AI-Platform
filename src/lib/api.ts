export class ApiError extends Error {
  status: number

  constructor(message: string, status: number) {
    super(message)
    this.name = 'ApiError'
    this.status = status
  }
}

export function getStoredToken() {
  return localStorage.getItem('eastbrook_token')
}

interface ApiFetchOptions extends Omit<RequestInit, 'body'> {
  auth?: boolean
  body?: unknown
}

export async function apiFetch<T>(path: string, options: ApiFetchOptions = {}): Promise<T> {
  const { auth = true, headers, body, ...rest } = options
  const requestHeaders = new Headers(headers)

  if (body !== undefined && !(body instanceof FormData) && !requestHeaders.has('Content-Type')) {
    requestHeaders.set('Content-Type', 'application/json')
  }

  if (auth) {
    const token = getStoredToken()
    if (token) {
      requestHeaders.set('Authorization', `Bearer ${token}`)
    }
  }

  const response = await fetch(path, {
    ...rest,
    headers: requestHeaders,
    body: body === undefined || body instanceof FormData ? body as BodyInit | undefined : JSON.stringify(body),
  })

  const contentType = response.headers.get('content-type') || ''
  const payload = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    const message =
      payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string'
        ? payload.error
        : `Request failed with status ${response.status}`
    throw new ApiError(message, response.status)
  }

  return payload as T
}

export function formatDateTime(value: string | null | undefined) {
  if (!value) return 'No activity yet'
  return new Date(value).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export function formatShortDate(value: string | null | undefined) {
  if (!value) return 'No activity yet'
  return new Date(value).toLocaleDateString([], {
    month: 'short',
    day: 'numeric',
  })
}
