import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { AuthProvider } from '../context/AuthContext.jsx'
import Login from '../pages/Login.jsx'
import axios from 'axios'


// Mock axios for login calls
vi.mock('axios', () => ({
  default: {
    post: vi.fn(),
  },
}))

// Minimal route setup for navigation
function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/admin-dashboard" element={<div>AdminDash</div>} />
      <Route path="/employee-dashboard" element={<div>EmpDash</div>} />
    </Routes>
  )
}

describe('Login', () => {
  beforeEach(() => {

    // Fresh mocks and storage before each test
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('logs in admin and navigates', async () => {

    // Backend returns a successful admin login
    axios.post.mockResolvedValueOnce({
      data: {
        success: true,
        token: 't',
        user: { _id: 'u1', name: 'A', email: 'a@ex.com', role: 'admin', shift: 'morning' },
      },
    })

    // Render login inside route and auth context
    render(
      <MemoryRouter initialEntries={[{ pathname: '/login' }] }>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )


    // Fill the form and submit
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'a@ex.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'pw' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))


    // Navigated to admin dashboard and saved token and user
    await screen.findByText('AdminDash')
    expect(localStorage.getItem('pos-user')).toBeTruthy()
    expect(localStorage.getItem('pos-token')).toBe('t')
  })

  it('shows error on failed login', async () => {

    // Backend rejects with an auth error
    axios.post.mockRejectedValueOnce({ response: { data: { message: 'Invalid credentials' } } })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/login' }] }>
        <AuthProvider>
          <App />
        </AuthProvider>
      </MemoryRouter>
    )


    // Submit wrong credentials
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'x@ex.com' } })
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'bad' } })
    fireEvent.click(screen.getByRole('button', { name: /login/i }))


    // Render error message
    expect(await screen.findByText(/invalid credentials/i)).toBeInTheDocument()
  })
})
