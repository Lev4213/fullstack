/** API origin: empty in Docker/prod (same host via reverse proxy), localhost:8000 in Vite dev. */
export function getApiBase(): string {
  const configured = import.meta.env.VITE_API_URL
  if (configured !== undefined && String(configured).length > 0) {
    return String(configured).replace(/\/$/, '')
  }
  if (import.meta.env.DEV) {
    return 'http://127.0.0.1:8000'
  }
  return ''
}
