import { useState, useRef } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { createPet, uploadPetPhoto } from '../api/pets'
import type { PetCreate } from '../types'

function validatePhone(phone: string | null | undefined): string | null {
  if (!phone || !phone.trim()) return null
  const digits = phone.replace(/\D/g, '')
  if (digits.length < 10) return 'Введите не менее 10 цифр'
  if (phone.length > 20) return 'Слишком длинный номер'
  return null
}

export default function CreatePet() {
  const { user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState('')
  const [photoFiles, setPhotoFiles] = useState<File[]>([])
  const [form, setForm] = useState<PetCreate>({
    name: '',
    species: '',
    city: null,
    is_lost: true,
  })

  if (authLoading || !user) {
    navigate('/login')
    return null
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    const nameTrim = form.name.trim()
    const speciesTrim = form.species.trim()
    if (!nameTrim) {
      setError('Укажите кличку животного')
      return
    }
    if (!speciesTrim) {
      setError('Укажите вид животного')
      return
    }
    const phoneErr = validatePhone(form.contact_phone ?? null)
    if (phoneErr) {
      setError(phoneErr)
      return
    }
    try {
      const cityTrim = (form.city ?? '').trim()
      const pet = await createPet({
        ...form,
        name: nameTrim,
        species: speciesTrim,
        city: cityTrim ? cityTrim : null,
      })
      for (const file of photoFiles) {
        await uploadPetPhoto(pet.id, file)
      }
      navigate(`/pet/${pet.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div className="page create-pet-page">
      <h1 className="create-pet-title">Создание объявления</h1>
      <p><Link to="/cabinet">← В кабинет</Link></p>

      <form className="create-pet-form" onSubmit={handleSubmit}>
        {error && <p className="error">{error}</p>}

        <section className="create-pet-section">
          <h2 className="create-pet-section-title">Выберите тип объявления</h2>
          <div className="create-pet-type-tabs">
            <button
              type="button"
              className={`create-pet-tab ${form.is_lost ? 'create-pet-tab-active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, is_lost: true }))}
            >
              Потерялся
            </button>
            <button
              type="button"
              className={`create-pet-tab ${!form.is_lost ? 'create-pet-tab-active' : ''}`}
              onClick={() => setForm((f) => ({ ...f, is_lost: false }))}
            >
              Найден
            </button>
          </div>
        </section>

        <section className="create-pet-section">
          <h2 className="create-pet-section-title">Заполните информацию о животном</h2>
          <div className="create-pet-fields-grid">
            <label>
              <span>Вид *</span>
              <input
                value={form.species}
                onChange={(e) => setForm((f) => ({ ...f, species: e.target.value }))}
                placeholder="кошка, собака..."
                required
              />
            </label>
            <label>
              <span>Порода</span>
              <input
                value={form.breed ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, breed: e.target.value || null }))}
                placeholder="Порода"
              />
            </label>
            <label>
              <span>Окрас</span>
              <input
                value={form.color ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, color: e.target.value || null }))}
                placeholder="Окрас"
              />
            </label>
            <label>
              <span>Пол</span>
              <select
                value={form.sex ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, sex: e.target.value || null }))}
              >
                <option value="">—</option>
                <option value="male">Самец</option>
                <option value="female">Самка</option>
              </select>
            </label>
            <label>
              <span>Кличка *</span>
              <input
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Кличка"
                required
              />
            </label>
          </div>
        </section>

        <section className="create-pet-section">
          <h2 className="create-pet-section-title">Район пропажи / находки</h2>
          <label className="create-pet-full-width">
            <input
              value={form.city ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value || null }))}
              placeholder="Город"
            />
          </label>
          <label className="create-pet-full-width">
            <input
              value={form.last_seen_place ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, last_seen_place: e.target.value || null }))}
              placeholder="Район или адрес"
            />
          </label>
          <label className="create-pet-full-width create-pet-date-label">
            <span>Дата</span>
            <input
              type="date"
              value={form.last_seen_date ? form.last_seen_date.toString().slice(0, 10) : ''}
              onChange={(e) =>
                setForm((f) => ({
                  ...f,
                  last_seen_date: e.target.value ? new Date(e.target.value).toISOString() : null,
                }))
              }
            />
          </label>
        </section>

        <section className="create-pet-section">
          <h2 className="create-pet-section-title">Загрузите фотографии животного</h2>
          <div
            className="create-pet-photo-zone"
            onClick={() => fileInputRef.current?.click()}
            onKeyDown={(e) => e.key === 'Enter' && fileInputRef.current?.click()}
            role="button"
            tabIndex={0}
            aria-label="Добавить фото"
          >
            <input
              ref={fileInputRef}
              type="file"
              accept=".jpg,.jpeg,.png,.gif,.webp"
              className="create-pet-photo-input"
              multiple
              onChange={(e) => {
                const input = e.target
                const files = Array.from(input.files ?? [])
                if (files.length === 0) return
                setPhotoFiles((prev) => {
                  const keys = new Set(prev.map((f) => `${f.name}-${f.size}-${f.lastModified}`))
                  const toAdd = files.filter((f) => !keys.has(`${f.name}-${f.size}-${f.lastModified}`))
                  return [...prev, ...toAdd]
                })
                // чтобы можно было выбрать те же файлы повторно
                input.value = ''
              }}
            />
            {photoFiles.length > 0 ? (
              <span className="create-pet-photo-name">Выбрано фото: {photoFiles.length}</span>
            ) : (
              <>
                <span className="create-pet-photo-icon">📷</span>
                <span className="create-pet-photo-hint">Нажмите, чтобы выбрать фото</span>
              </>
            )}
          </div>
        </section>

        <section className="create-pet-section">
          <h2 className="create-pet-section-title">Особые приметы</h2>
          <label className="create-pet-full-width">
            <textarea
              value={form.description ?? ''}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value || null }))}
              placeholder="Опишите приметы животного"
              rows={3}
            />
          </label>
        </section>

        <section className="create-pet-section">
          <h2 className="create-pet-section-title">Ваши контактные данные</h2>
          <div className="create-pet-contact-fields">
            <label>
              <span>Имя</span>
              <input
                value={form.contact_name ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contact_name: e.target.value || null }))}
                placeholder="Как к вам обращаться"
              />
            </label>
            <label>
              <span>Телефон</span>
              <input
                type="tel"
                value={form.contact_phone ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contact_phone: e.target.value || null }))}
                placeholder="+7 или 10 цифр"
              />
            </label>
            <label>
              <span>Почта *</span>
              <input
                type="email"
                value={form.contact_email ?? ''}
                onChange={(e) => setForm((f) => ({ ...f, contact_email: e.target.value || null }))}
                placeholder="Email для связи"
              />
            </label>
          </div>
        </section>

        <button type="submit" className="create-pet-submit">
          Опубликовать
        </button>
      </form>
    </div>
  )
}
