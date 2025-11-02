import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Categories from '../components/Categories.jsx'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

function mockList(data) {
  axios.get.mockResolvedValueOnce({ data: { success: true, data } })
}

describe('Categories', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    localStorage.setItem('pos-token', 't')
  })

  it('Add creates category (POST) then reloads list (GET)', async () => {
    // Initial empty list
    mockList([])
    render(<Categories />)
    await screen.findByText(/categories/i)

    const name = screen.getByPlaceholderText(/e\.g\., electronics/i)
    const desc = screen.getByPlaceholderText(/short summary/i)
    fireEvent.change(name, { target: { value: 'NewCat' } })
    fireEvent.change(desc, { target: { value: 'Desc' } })

    axios.post.mockResolvedValueOnce({ data: { success: true } })
    // After save it reloads
    mockList([{ _id: 'id1', id: 1, name: 'NewCat', description: 'Desc' }])

    fireEvent.click(screen.getByRole('button', { name: /add category/i }))

    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    await waitFor(() => expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2))
    expect(screen.getByText('NewCat')).toBeInTheDocument()
  })

  it('Edit and Delete call proper endpoints', async () => {
    // Load with one category
    mockList([{ _id: 'cid', id: 2, name: 'Cat', description: 'D' }])
    render(<Categories />)
    await screen.findByText('Cat')

    // Edit flow: click Edit -> Save submits PUT
    fireEvent.click(screen.getByRole('button', { name: /edit/i }))
    const saveBtn = await screen.findByRole('button', { name: /save/i })
    axios.put.mockResolvedValueOnce({ data: { success: true } })
    // After save, reload list
    mockList([{ _id: 'cid', id: 2, name: 'Cat2', description: 'D2' }])
    fireEvent.click(saveBtn)

    await waitFor(() => expect(axios.put).toHaveBeenCalled())
    const [putUrl] = axios.put.mock.calls[0]
    expect(String(putUrl)).toMatch(/\/api\/category\/update\/cid$/)
    await waitFor(() => expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2))

    // Delete flow: confirm -> DELETE endpoint
    window.confirm = vi.fn(() => true)
    axios.delete.mockResolvedValueOnce({ data: { success: true } })
    // And reload afterwards
    mockList([])
    fireEvent.click(screen.getByRole('button', { name: /delete/i }))

    await waitFor(() => expect(axios.delete).toHaveBeenCalled())
    const [delUrl] = axios.delete.mock.calls[0]
    expect(String(delUrl)).toMatch(/\/api\/category\/delete\/cid$/)
  })
})
