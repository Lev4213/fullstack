export interface User {
  id: number
  email: string
  created_at: string
}

export interface Pet {
  id: number
  name: string
  species: string
  sex: string | null
  breed: string | null
  color: string | null
  city: string | null
  last_seen_place: string | null
  last_seen_date: string | null
  description: string | null
  is_lost: boolean
  contact_name: string | null
  contact_phone: string | null
  contact_email: string | null
  owner_id: number | null
  is_active: boolean
  image_path: string | null
  image_paths: string[]
  created_at: string
}

export interface PetCreate {
  name: string
  species: string
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
