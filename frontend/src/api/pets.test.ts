import { describe, expect, it } from 'vitest'
import { buildQuery, getFlyerUrl, getPetImageUrl } from './pets'

describe('buildQuery', () => {
  it('returns empty string without filters', () => {
    expect(buildQuery()).toBe('')
  })

  it('builds query with pagination and search', () => {
    const q = buildQuery({ limit: 12, offset: 24, q: 'кошка', species: 'кошка' })
    expect(q).toContain('limit=12')
    expect(q).toContain('offset=24')
    expect(q).toContain('q=')
    expect(q).toContain('species=')
    expect(q.startsWith('?')).toBe(true)
  })

  it('includes is_lost flag', () => {
    expect(buildQuery({ is_lost: false })).toContain('is_lost=false')
  })
})

describe('URL helpers', () => {
  it('getFlyerUrl points to pdf endpoint', () => {
    expect(getFlyerUrl(5)).toMatch(/\/pets\/5\/flyer\.pdf$/)
  })

  it('getPetImageUrl returns null without path', () => {
    expect(getPetImageUrl(null)).toBeNull()
  })

  it('getPetImageUrl builds uploads url', () => {
    expect(getPetImageUrl('pets/x.jpg')).toContain('/uploads/pets/x.jpg')
  })
})
