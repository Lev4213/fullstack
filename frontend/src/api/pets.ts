import { api } from './client'
import type { Pet, PetCreate } from '../types'

export interface PetFilters {
  species?: string
  sex?: string
  breed?: string
  city?: string
  is_lost?: boolean
  date_from?: string
  date_to?: string
}

function buildQuery(f?: PetFilters): string {
  if (!f) return ''
  const params = new URLSearchParams()
  if (f.species) params.set('species', f.species)
  if (f.sex) params.set('sex', f.sex)
  if (f.breed) params.set('breed', f.breed)
  if (f.city) params.set('city', f.city)
  if (f.is_lost !== undefined) params.set('is_lost', String(f.is_lost))
  if (f.date_from) params.set('date_from', f.date_from)
  if (f.date_to) params.set('date_to', f.date_to)
  const q = params.toString()
  return q ? `?${q}` : ''
}

export async function getPets(filters?: PetFilters): Promise<Pet[]> {
  return api<Pet[]>(`/pets/${buildQuery(filters)}`)
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

export async function deactivatePet(id: number): Promise<void> {
  return api<void>(`/pets/${id}`, { method: 'DELETE' })
}

export async function deletePetPermanent(id: number): Promise<void> {
  return api<void>(`/pets/${id}/permanent`, { method: 'DELETE' })
}

export function getFlyerUrl(id: number): string {
  const base = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'
  return `${base}/pets/${id}/flyer.pdf`
}
