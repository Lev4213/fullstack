import { describe, expect, it, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Nav from './Nav'
import { AuthProvider } from '../contexts/AuthContext'
import * as authApi from '../api/auth'
import { vi } from 'vitest'

vi.mock('../api/auth', () => ({
  getMe: vi.fn(),
  login: vi.fn(),
  register: vi.fn(),
}))

function renderNav() {
  return render(
    <AuthProvider>
      <MemoryRouter>
        <Nav />
      </MemoryRouter>
    </AuthProvider>,
  )
}

describe('Nav', () => {
  beforeEach(() => {
    vi.mocked(authApi.getMe).mockReset()
  })

  it('shows login button for guest', async () => {
    vi.mocked(authApi.getMe).mockRejectedValue(new Error('no token'))
    renderNav()
    expect(await screen.findByText('Войти')).toBeInTheDocument()
  })

  it('shows cabinet links for authenticated user', async () => {
    vi.mocked(authApi.getMe).mockResolvedValue({
      id: 1,
      email: 'user@example.com',
      created_at: '2025-01-01T00:00:00Z',
    })
    localStorage.setItem('token', 'fake-token')
    renderNav()
    await waitFor(() => {
      expect(screen.queryByText('Войти')).not.toBeInTheDocument()
    })
    expect(screen.getAllByText('Личный кабинет').length).toBeGreaterThan(0)
  })
})
