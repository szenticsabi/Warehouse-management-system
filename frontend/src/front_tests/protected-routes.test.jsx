import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider } from '../context/AuthContext.jsx'
import ProtectedRoutes from '../components/ProtectedRoutes.jsx'


// Minimal app used for testing ProtecteRoutes behavior
function AppWithRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<div>Login Page</div>} />
      <Route path="/unauthorized" element={<div>Unauthorized Page</div>} />
      <Route
        path="/"
        element={
          <ProtectedRoutes requireRole="admin">
            <div>Admin Secret</div>
          </ProtectedRoutes>
        }
      />
    </Routes>
  )
}

describe('ProtectedRoutes', () => {
  beforeEach(() => {

    // Ensure clean auth state before each test
    localStorage.clear()
  })

  it('redirects to /login when no user', async () => {

    // If no user in storage, should navigate to /login
    const { findByText } = render(
      <MemoryRouter initialEntries={[{ pathname: '/' }] }>
        <AuthProvider>
          <AppWithRoutes />
        </AuthProvider>
      </MemoryRouter>
    )
    expect(await findByText(/login page/i)).toBeInTheDocument()
  })

  it('renders children when role is allowed', async () => {

    // Seed and admin user to access the protected content
    localStorage.setItem('pos-user', JSON.stringify({ name: 'A', role: 'admin' }))
    const { findByText } = render(
      <MemoryRouter initialEntries={[{ pathname: '/' }] }>
        <AuthProvider>
          <AppWithRoutes />
        </AuthProvider>
      </MemoryRouter>
    )
    expect(await findByText(/admin secret/i)).toBeInTheDocument()
  })
})
