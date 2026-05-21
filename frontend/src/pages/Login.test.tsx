import { describe, expect, it, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Login from './Login'

const loginMock = vi.fn()
const navigateMock = vi.fn()

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual<typeof import('react-router-dom')>('react-router-dom')
  return {
    ...actual,
    useNavigate: () => navigateMock,
  }
})

vi.mock('../contexts/useAuth', () => ({
  useAuth: () => ({
    user: null,
    loading: false,
    login: loginMock,
    register: vi.fn(),
    logout: vi.fn(),
    setUser: vi.fn(),
  }),
}))

describe('Login page', () => {
  it('shows validation error for empty password', async () => {
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    fireEvent.submit(screen.getByRole('button', { name: 'Войти' }).closest('form')!)
    expect(await screen.findByText('Введите пароль')).toBeInTheDocument()
    expect(loginMock).not.toHaveBeenCalled()
  })

  it('calls login and navigates on success', async () => {
    loginMock.mockResolvedValue(undefined)
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getAllByPlaceholderText('Почта')[0], {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Пароль')[0], {
      target: { value: 'secret123' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))
    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith('user@example.com', 'secret123')
      expect(navigateMock).toHaveBeenCalledWith('/cabinet')
    })
  })

  it('shows server error message', async () => {
    loginMock.mockRejectedValue(new Error('Неверный пароль'))
    render(
      <MemoryRouter>
        <Login />
      </MemoryRouter>,
    )
    fireEvent.change(screen.getAllByPlaceholderText('Почта')[0], {
      target: { value: 'user@example.com' },
    })
    fireEvent.change(screen.getAllByPlaceholderText('Пароль')[0], {
      target: { value: 'x' },
    })
    fireEvent.click(screen.getByRole('button', { name: 'Войти' }))
    expect(await screen.findByText('Неверный пароль')).toBeInTheDocument()
  })
})
