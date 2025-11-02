import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Navbar from '../components/Navbar.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    post: vi.fn(() => Promise.resolve({ data: { success: true } })),
  },
}))

function withAuth(user) {
  // Prime localStorage for AuthProvider
  localStorage.setItem('pos-user', JSON.stringify(user))
  localStorage.setItem('pos-token', 'test-token')
  return ({ children }) => <AuthProvider>{children}</AuthProvider>
}

describe('Navbar', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('shows admin icon when role=admin', async () => {
    const Wrapper = withAuth({ name: 'Alice', email: 'a@a.com', role: 'admin' })
    render(
      <MemoryRouter>
        <Wrapper>
          <Navbar />
        </Wrapper>
      </MemoryRouter>
    )

    const avatar = await screen.findByAltText('User avatar')
    // Src should include the admin image filename
    expect(avatar.getAttribute('src') || '').toMatch(/adminprof/i)
  })

  it('shows employee icon when role=employee', async () => {
    const Wrapper = withAuth({ name: 'Bob', email: 'b@b.com', role: 'employee' })
    render(
      <MemoryRouter>
        <Wrapper>
          <Navbar />
        </Wrapper>
      </MemoryRouter>
    )

    const avatar = await screen.findByAltText('User avatar')
    expect(avatar.getAttribute('src') || '').toMatch(/employeeprof/i)
  })

  it('logout triggers server call and clears auth; profile modal opens', async () => {
    const Wrapper = withAuth({ name: 'User', email: 'u@u.com', role: 'admin' })
    render(
      <MemoryRouter>
        <Wrapper>
          <Navbar />
        </Wrapper>
      </MemoryRouter>
    )

    const avatar = await screen.findByAltText('User avatar')
    // Open dropdown
    fireEvent.click(avatar) 

    // Open profile modal
    // There are two "Your profile" buttons (desktop + mobile); pick the dropdown one
    const profileBtns = await screen.findAllByRole('button', { name: /your profile/i })
    const profileBtn = profileBtns[0]
    fireEvent.click(profileBtn)
    expect(await screen.findByRole('dialog')).toBeInTheDocument()

    // Trigger logout (prefer the dropdown's Logout button)
    const logoutBtns = screen.getAllByRole('button', { name: /logout/i })
    fireEvent.click(logoutBtns[0])

    // Axios POST called to logout endpoint
    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    // localStorage cleared by context logout (wait for async state flush)
    await waitFor(() => expect(localStorage.getItem('pos-user')).toBeNull())
    await waitFor(() => expect(localStorage.getItem('pos-token')).toBeNull())
  })
})
