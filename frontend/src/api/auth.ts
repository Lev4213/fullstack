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
