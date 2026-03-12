import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { createPet } from '../api/pets'
import type { PetCreate } from '../types'

export default function CreatePet() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [form, setForm] = useState<PetCreate>({
    name: '',
    species: '',
    is_lost: true,
  })

  if (authLoading || !user) {
    navigate('/login')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    try {
      const pet = await createPet(form)
      navigate(`/pet/${pet.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div className="page form-page">
      <h1>Новое объявление</h1>
      <p><Link to="/cabinet">← В кабинет</Link></p>
      <form onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}
        <label>Имя питомца * <input value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} required /></label>
        <label>Вид * <input value={form.species} onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))} placeholder="кошка, собака..." required /></label>
        <label>Пол <input value={form.sex ?? ''} onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value || null }))} placeholder="male / female" /></label>
        <label>Порода <input value={form.breed ?? ''} onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value || null }))} /></label>
        <label>Окрас <input value={form.color ?? ''} onChange={(e) => setForm((f) => ({ ...f, color: e.target.value || null }))} /></label>
        <label>Город <input value={form.city ?? ''} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || null }))} /></label>
        <label>Где видели <input value={form.last_seen_place ?? ''} onChange={(e) => setForm((f) => ({ ...f, last_seen_place: e.target.value || null }))} /></label>
        <label>Описание <textarea value={form.description ?? ''} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))} /></label>
        <label>Контакт (имя) <input value={form.contact_name ?? ''} onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value || null }))} /></label>
        <label>Телефон <input value={form.contact_phone ?? ''} onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value || null }))} /></label>
        <label>Email <input type="email" value={form.contact_email ?? ''} onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value || null }))} /></label>
        <label><input type="checkbox" checked={form.is_lost} onChange={(e) => setForm((f) => ({ ...f, is_lost: e.target.checked }))} /> Потерян (иначе — найден)</label>
        <button type="submit">Создать</button>
      </form>
    </div>
  )
}
