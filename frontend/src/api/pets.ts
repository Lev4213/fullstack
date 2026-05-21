import { api } from './client'
import type { Pet, PetCreate } from '../types'

export interface PetFilters {
  species?: string
  sex?: string
  breed?: string
  color?: string
  city?: string
  is_lost?: boolean
  date_from?: string
  date_to?: string
  q?: string
  limit?: number
  offset?: number
}

export interface PetListResponse {
  items: Pet[]
  total: number
}

export function buildQuery(f?: PetFilters): string {
  if (!f) return ''
  const params = new URLSearchParams()
  if (f.species) params.set('species', f.species)
  if (f.sex) params.set('sex', f.sex)
  if (f.breed) params.set('breed', f.breed)
  if (f.color) params.set('color', f.color)
  if (f.city) params.set('city', f.city)
  if (f.is_lost !== undefined) params.set('is_lost', String(f.is_lost))
  if (f.date_from) params.set('date_from', f.date_from)
  if (f.date_to) params.set('date_to', f.date_to)
  if (f.q) params.set('q', f.q)
  if (f.limit != null) params.set('limit', String(f.limit))
  if (f.offset != null) params.set('offset', String(f.offset))
  const s = params.toString()
  return s ? `?${s}` : ''
}

export async function getPets(filters?: PetFilters): Promise<PetListResponse> {
  const query = buildQuery(filters)
  return api<PetListResponse>(`/pets${query}`)
}

export async function getMyPets(): Promise<Pet[]> {
  return api<Pet[]>('/pets/my')
}

export async function getPet(id: number): Promise<Pet> {
  return api<Pet>(`/pets/${id}`)
}

export async function createPet(data: PetCreate): Promise<Pet> {
  return api<Pet>('/pets/', {
    method: 'POST',
    body: JSON.stringify(data),
  })
}

export interface PetUpdate {
  name?: string
  species?: string
  sex?: string | null
  breed?: string | null
  color?: string | null
  city?: string | null
  last_seen_place?: string | null
  last_seen_date?: string | null
  description?: string | null
  is_lost?: boolean
  contact_name?: string | null
  contact_phone?: string | null
  contact_email?: string | null
}

export async function updatePet(id: number, data: PetUpdate): Promise<Pet> {
  return api<Pet>(`/pets/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  })
}

export async function deactivatePet(id: number): Promise<void> {
  return api<void>(`/pets/${id}`, { method: 'DELETE' })
}

export async function deletePetPermanent(id: number): Promise<void> {
  return api<void>(`/pets/${id}/permanent`, { method: 'DELETE' })
}

import { getApiBase } from './baseUrl'

export function getFlyerUrl(id: number): string {
  return `${getApiBase()}/pets/${id}/flyer.pdf`
}

const apiBase = getApiBase()

export function getPetImageUrl(imagePath: string | null): string | null {
  if (!imagePath) return null
  return `${apiBase}/uploads/${imagePath}`
}

export async function uploadPetPhoto(petId: number, file: File): Promise<Pet> {
  const token = localStorage.getItem('token')
  const form = new FormData()
  form.append('image', file)
  const res = await fetch(`${apiBase}/pets/${petId}/photo`, {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || res.statusText)
  }
  return res.json()
}
