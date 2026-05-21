import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/useAuth'
import { getMyPets, deactivatePet, deletePetPermanent, getFlyerUrl, getPetImageUrl } from '../api/pets'
import { changeEmail, changePassword } from '../api/auth'
import type { Pet } from '../types'

export default function Cabinet() {
  const { user, loading: authLoading, logout, setUser } = useAuth()
  const navigate = useNavigate()
  const [pets, setPets] = useState<Pet[]>([])
  const [loading, setLoading] = useState(true)
  const [emailNew, setEmailNew] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [pwOld, setPwOld] = useState('')
  const [pwNew, setPwNew] = useState('')
  const [pwNew2, setPwNew2] = useState('')
  const [showEmailPw, setShowEmailPw] = useState(false)
  const [showOldPw, setShowOldPw] = useState(false)
  const [settingsError, setSettingsError] = useState<string | null>(null)
  const [settingsOk, setSettingsOk] = useState<string | null>(null)

  function isFeminineSpecies(speciesRaw: string | null | undefined): boolean {
    const s = (speciesRaw ?? '').trim().toLowerCase()
    if (!s) return false
    if (s.includes('кошка') || s.includes('собака')) return true
    return s.endsWith('а') || s.endsWith('я')
  }

  function isFeminineBySexOrSpecies(
    sexRaw: string | null | undefined,
    speciesRaw: string | null | undefined
  ): boolean {
    if (sexRaw === 'female') return true
    if (sexRaw === 'male') return false
    return isFeminineSpecies(speciesRaw)
  }

  function lostVerb(sexRaw: string | null | undefined, speciesRaw: string | null | undefined): string {
    return isFeminineBySexOrSpecies(sexRaw, speciesRaw) ? 'Пропала' : 'Пропал'
  }

  function foundVerb(sexRaw: string | null | undefined, speciesRaw: string | null | undefined): string {
    return isFeminineBySexOrSpecies(sexRaw, speciesRaw) ? 'Найдена' : 'Найден'
  }

  function displaySpecies(sexRaw: string | null | undefined, speciesRaw: string): string {
    const s = speciesRaw.trim().toLowerCase()
    if (s === 'кошка') {
      if (sexRaw === 'female') return 'кошка'
      if (sexRaw === 'male') return 'кот'
      return 'кот/кошка'
    }
    if (s === 'собака') {
      if (sexRaw === 'female') return 'собака'
      if (sexRaw === 'male') return 'пёс'
      return 'пёс/собака'
    }
    return speciesRaw
  }

  useEffect(() => {
    if (!user) {
      setLoading(false)
      return
    }
    getMyPets()
      .then(setPets)
      .catch(() => setPets([]))
      .finally(() => setLoading(false))
  }, [user])

  if (authLoading) return <div className="page"><p>Загрузка...</p></div>
  if (!user) {
    navigate('/login')
    return null
  }

  async function handleDeactivate(id: number) {
    if (!confirm('Снять объявление с публикации?')) return
    try {
      await deactivatePet(id)
      setPets((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function handleDelete(id: number) {
    if (!confirm('Удалить объявление навсегда? Это нельзя отменить.')) return
    try {
      await deletePetPermanent(id)
      setPets((prev) => prev.filter((p) => p.id !== id))
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Ошибка')
    }
  }

  async function handleChangeEmail(e: React.FormEvent) {
    e.preventDefault()
    setSettingsError(null)
    setSettingsOk(null)
    try {
      const updated = await changeEmail(emailNew.trim(), emailPassword)
      setUser(updated)
      setEmailPassword('')
      setSettingsOk('Почта успешно изменена')
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault()
    setSettingsError(null)
    setSettingsOk(null)
    if (pwNew !== pwNew2) {
      setSettingsError('Новые пароли не совпадают')
      return
    }
    try {
      await changePassword(pwOld, pwNew)
      setPwOld('')
      setPwNew('')
      setPwNew2('')
      setSettingsOk('Пароль успешно изменён')
    } catch (err) {
      setSettingsError(err instanceof Error ? err.message : 'Ошибка')
    }
  }

  return (
    <div className="page cabinet-page">
      <h1 className="cabinet-title">Личный кабинет</h1>

      <div className="cabinet-layout">
        <aside className="cabinet-profile">
          <div className="cabinet-avatar">
            {user.email.slice(0, 1).toUpperCase()}
          </div>
          <p className="cabinet-profile-label">Имя</p>
          <p className="cabinet-profile-value">{user.email.split('@')[0]}</p>
          <p className="cabinet-profile-label">Email</p>
          <p className="cabinet-profile-value">{user.email}</p>
          <button type="button" className="cabinet-logout" onClick={logout}>
            Выйти
          </button>

          <div className="cabinet-settings">
            <h3 className="cabinet-settings-title">Настройки</h3>
            {settingsError && <p className="cabinet-settings-error">{settingsError}</p>}
            {settingsOk && <p className="cabinet-settings-ok">{settingsOk}</p>}

            <form className="cabinet-settings-form" onSubmit={handleChangeEmail}>
              <p className="cabinet-settings-subtitle">Сменить почту</p>
              <label className="cabinet-settings-label">
                <span>Новый email</span>
                <input
                  type="email"
                  value={emailNew}
                  onChange={(ev) => setEmailNew(ev.target.value)}
                  placeholder="new@email.com"
                  required
                />
              </label>
              <label className="cabinet-settings-label">
                <span>Пароль для подтверждения</span>
                <div className="cabinet-settings-password-row">
                  <input
                    type={showEmailPw ? 'text' : 'password'}
                    value={emailPassword}
                    onChange={(ev) => setEmailPassword(ev.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="cabinet-settings-showpw"
                    onClick={() => setShowEmailPw((v) => !v)}
                    aria-label={showEmailPw ? 'Скрыть пароль' : 'Показать пароль'}
                    title={showEmailPw ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <img src="/eye.svg" alt="" aria-hidden className="cabinet-settings-showpw-icon" />
                  </button>
                </div>
              </label>
              <button type="submit" className="cabinet-settings-submit">
                Сохранить email
              </button>
            </form>

            <form className="cabinet-settings-form" onSubmit={handleChangePassword}>
              <p className="cabinet-settings-subtitle">Сменить пароль</p>
              <label className="cabinet-settings-label">
                <span>Текущий пароль</span>
                <div className="cabinet-settings-password-row">
                  <input
                    type={showOldPw ? 'text' : 'password'}
                    value={pwOld}
                    onChange={(ev) => setPwOld(ev.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="cabinet-settings-showpw"
                    onClick={() => setShowOldPw((v) => !v)}
                    aria-label={showOldPw ? 'Скрыть пароль' : 'Показать пароль'}
                    title={showOldPw ? 'Скрыть пароль' : 'Показать пароль'}
                  >
                    <img src="/eye.svg" alt="" aria-hidden className="cabinet-settings-showpw-icon" />
                  </button>
                </div>
              </label>
              <label className="cabinet-settings-label">
                <span>Новый пароль</span>
                <input
                  type="password"
                  value={pwNew}
                  onChange={(ev) => setPwNew(ev.target.value)}
                  required
                />
              </label>
              <label className="cabinet-settings-label">
                <span>Повторите новый пароль</span>
                <input
                  type="password"
                  value={pwNew2}
                  onChange={(ev) => setPwNew2(ev.target.value)}
                  required
                />
              </label>
              <button type="submit" className="cabinet-settings-submit">
                Сохранить пароль
              </button>
            </form>
          </div>
        </aside>

        <section className="cabinet-ads">
          <div className="cabinet-ads-header">
            <h2 className="cabinet-ads-title">Ваши объявления</h2>
            <Link to="/cabinet/new" className="cabinet-create-btn">Создать объявление</Link>
          </div>

          {loading ? (
            <p className="cabinet-loading">Загрузка...</p>
          ) : pets.length === 0 ? (
            <p className="cabinet-empty">У вас пока нет объявлений.</p>
          ) : (
            <div className="cabinet-card-grid">
              {pets.map((pet) => {
                const imageUrl = pet.image_path
                  ? getPetImageUrl(pet.image_path)
                  : pet.image_paths?.length
                    ? getPetImageUrl(pet.image_paths[0])
                    : null
                return (
                  <article key={pet.id} className="cabinet-card">
                    <Link to={`/pet/${pet.id}`} className="cabinet-card-image-link">
                      <div className="cabinet-card-image">
                        {imageUrl ? (
                          <img src={imageUrl} alt={pet.name} />
                        ) : (
                          <span className="cabinet-card-no-photo">{pet.species.slice(0, 1)}</span>
                        )}
                      </div>
                    </Link>
                    <div className="cabinet-card-body">
                      <Link to={`/pet/${pet.id}`} className="cabinet-card-title">
                        {(pet.is_lost ? lostVerb(pet.sex, pet.species) : foundVerb(pet.sex, pet.species))}{' '}
                        {displaySpecies(pet.sex, pet.species)} по кличке {pet.name}
                      </Link>
                      <p className="cabinet-card-location">
                        Район находки/пропажи: {pet.last_seen_place || pet.city || '—'}
                      </p>
                      <p className="cabinet-card-date">
                        Дата: {pet.last_seen_date ? new Date(pet.last_seen_date).toLocaleDateString('ru-RU') : '—'}
                      </p>
                      <p className="cabinet-card-features">
                        Особые приметы: {pet.description ? `${pet.description.slice(0, 60)}${pet.description.length > 60 ? '…' : ''}` : '—'}
                      </p>
                      <div className="cabinet-card-actions">
                        <div className="cabinet-card-actions-row">
                          <Link to={`/cabinet/edit/${pet.id}`} className="cabinet-card-btn cabinet-card-btn-edit">
                            Изменить
                          </Link>
                          <button
                            type="button"
                            className="cabinet-card-btn cabinet-card-btn-secondary"
                            onClick={() => handleDeactivate(pet.id)}
                          >
                            Снять
                          </button>
                          <button
                            type="button"
                            className="cabinet-card-btn cabinet-card-btn-danger"
                            onClick={() => handleDelete(pet.id)}
                          >
                            Удалить
                          </button>
                        </div>
                        <a href={getFlyerUrl(pet.id)} target="_blank" rel="noreferrer" className="cabinet-card-link">
                          <img src="/download.svg" alt="" aria-hidden className="cabinet-card-link-icon" />
                          Скачать листовку
                        </a>
                      </div>
                    </div>
                  </article>
                )
              })}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
