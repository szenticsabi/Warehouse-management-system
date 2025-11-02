import { MemoryRouter, Routes, Route } from 'react-router-dom'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import ToOrder from '../components/ToOrder.jsx'
import axios from 'axios'

// Mock axios with Vitest so we can control network responses
vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

describe('To-Order', () => {
  beforeEach(() => {

    // Reset mocks and set a token since the component sends authorization
    vi.restoreAllMocks()
    localStorage.clear()
    localStorage.setItem('pos-token', 't')
  })

  it('incoming items trigger add-many, then list loads', async () => {

    // POSt /add-selection succeeds, then GET /list returns one populated row
    axios.post.mockResolvedValueOnce({ data: { success: true } })
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: [{ _id: 'r1', status: 'pending', product: { name: 'Prod1', sku: 'S1', price: 10, stock: 5 } }] }
    })

    // Start at /to-order with location.state carrying incoming items
    render(
      <MemoryRouter initialEntries={[{ pathname: '/to-order', state: { items: [{ productId: 'p1', stock: 2 }] } }]}>
        <Routes>
          <Route path="/to-order" element={<ToOrder />} />
        </Routes>
      </MemoryRouter>
    )

    // UI shows the loaded product, called POST and GET
    expect(await screen.findByText('Prod1')).toBeInTheDocument()
    expect(axios.post).toHaveBeenCalled()
    expect(axios.get).toHaveBeenCalled()
  })

  it('saving row sends PUT with new status', async () => {

    // First GET loads a single pending row
    axios.get.mockResolvedValueOnce({
      data: { success: true, data: [{ _id: 'r2', status: 'pending', product: { name: 'Prod2', sku: 'S2', price: 10, stock: 5 } }] }
    })

    // PUT succeeds, component reloads the lost
    axios.put.mockResolvedValueOnce({ data: { success: true } })
    axios.get.mockResolvedValueOnce({ data: { success: true, data: [] } })

    render(
      <MemoryRouter initialEntries={[{ pathname: '/to-order' }]}>
        <Routes>
          <Route path="/to-order" element={<ToOrder />} />
        </Routes>
      </MemoryRouter>
    )

    // Change status to "ordered" and click Save
    await screen.findByText('Prod2')
    const select = screen.getByRole('combobox')
    fireEvent.change(select, { target: { value: 'ordered' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))

    // Assert PUT endpoint and payload
    await waitFor(() => expect(axios.put).toHaveBeenCalled())
    const [url, body] = axios.put.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/toorder\/update\/r2$/)
    expect(body).toEqual({ status: 'ordered' })
  })
})
