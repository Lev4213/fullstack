import { describe, expect, it, vi, beforeEach } from 'vitest'
import { api } from './client'

describe('api client', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    localStorage.clear()
  })

  it('sends Authorization when token exists', async () => {
    localStorage.setItem('token', 'abc')
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ ok: true }),
    } as Response)

    await api('/test')
    const [, init] = vi.mocked(fetch).mock.calls[0]
    const headers = init?.headers as Record<string, string>
    expect(headers.Authorization).toBe('Bearer abc')
  })

  it('throws with detail from server', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({ detail: 'Ошибка сервера' }),
    } as Response)

    await expect(api('/fail')).rejects.toThrow('Ошибка сервера')
  })

  it('returns undefined for 204', async () => {
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      status: 204,
    } as Response)

    const result = await api<void>('/empty')
    expect(result).toBeUndefined()
  })
})
