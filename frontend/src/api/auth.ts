import { api, API_BASE } from './client'
import type { User } from '../types'

export async function register(email: string, password: string): Promise<User> {
  return api<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const body = new URLSearchParams({ username: email, password })
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}

export async function getMe(): Promise<User> {
  return api<User>('/auth/me')
}

export async function deleteAccount(): Promise<void> {
  return api<void>('/auth/me', { method: 'DELETE' })
}

export async function changeEmail(new_email: string, password: string): Promise<User> {
  return api<User>('/auth/me/email', {
    method: 'PATCH',
    body: JSON.stringify({ new_email, password }),
  })
}

export async function changePassword(old_password: string, new_password: string): Promise<void> {
  return api<void>('/auth/me/password', {
    method: 'PATCH',
    body: JSON.stringify({ old_password, new_password }),
  })
}
