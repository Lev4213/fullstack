import { api, apiForm } from './client'
import type { User } from '../types'

export async function register(email: string, password: string): Promise<User> {
  return api<User>('/auth/register', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  })
}

export async function login(email: string, password: string): Promise<{ access_token: string; token_type: string }> {
  const form = new FormData()
  form.append('username', email)
  form.append('password', password)
  return apiForm('/auth/login', form)
}

export async function getMe(): Promise<User> {
  return api<User>('/auth/me')
}

export async function deleteAccount(): Promise<void> {
  return api<void>('/auth/me', { method: 'DELETE' })
}
