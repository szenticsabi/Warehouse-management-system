import { render, screen, waitFor } from '@testing-library/react'
import Orders from '../components/Orders.jsx'
import { AuthProvider } from '../context/AuthContext.jsx'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

function withRole(role) {
  localStorage.setItem('pos-user', JSON.stringify({ name: 'U', role }))
  localStorage.setItem('pos-token', 't')
  return ({ children }) => <AuthProvider>{children}</AuthProvider>
}

function ordersPayload(list) {
  axios.get.mockResolvedValueOnce({ data: { success: true, data: list } })
}

describe('Orders', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
  })

  it('employee does not see Delete button', async () => {
    ordersPayload([
      {
        _id: 'o1', id: 1, createdAt: '2024-01-03T00:00:00Z',
        items: [{ product: { _id: 'p1', name: 'Prod', sku: 'S', price: 10 }, qty: 1, status: 'pending' }],
      },
    ])
    const Wrapper = withRole('employee')
    render(<Wrapper><Orders /></Wrapper>)
    await screen.findByText(/Order #1/)
    expect(screen.queryByRole('button', { name: /delete/i })).toBeNull()
  })

  it('Save calls PUT and reloads', async () => {
    // Initial load
    ordersPayload([
      {
        _id: 'o1', id: 1, createdAt: '2024-01-03T00:00:00Z',
        items: [
          { product: { _id: 'p1', name: 'A', sku: 'A', price: 10 }, qty: 2, status: 'pending' },
        ],
      },
    ])
    // Save response
    axios.put.mockResolvedValueOnce({ data: { success: true } })
    // Reload after save
    ordersPayload([
      {
        _id: 'o1', id: 1, createdAt: '2024-01-03T00:00:00Z',
        items: [
          { product: { _id: 'p1', name: 'A', sku: 'A', price: 10 }, qty: 2, status: 'fulfilled' },
        ],
      },
    ])

    const Wrapper = withRole('admin')
    render(<Wrapper><Orders /></Wrapper>)
    await screen.findByText(/Order #1/)

    // Click Save
    const saveBtn = screen.getByRole('button', { name: /save/i })
    saveBtn.click()

    await waitFor(() => expect(axios.put).toHaveBeenCalled())
    const [url, body] = axios.put.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/order\/update\/o1$/)
    expect(body).toMatchObject({ items: [{ product: 'p1', qty: expect.any(Number), status: expect.any(String) }] })
    /** And reload called 
     * Initial GET + reload GET (React may issue an extra re-render in test env) 
    */
    await waitFor(() => expect(axios.get.mock.calls.length).toBeGreaterThanOrEqual(2))
  })

  it('sorts: pending on top by createdAt asc; fulfilled at bottom', async () => {
    ordersPayload([
      {
        _id: 'oA', id: 10, createdAt: '2024-01-05T00:00:00Z',
        items: [{ product: { _id: 'p1', name: 'x', price: 1 }, qty: 1, status: 'pending' }],
      },
      {
        _id: 'oB', id: 11, createdAt: '2024-01-01T00:00:00Z',
        items: [{ product: { _id: 'p2', name: 'y', price: 1 }, qty: 1, status: 'fulfilled' }],
      },
      {
        _id: 'oC', id: 12, createdAt: '2024-01-03T00:00:00Z',
        items: [{ product: { _id: 'p3', name: 'z', price: 1 }, qty: 1, status: 'pending' }],
      },
    ])

    const Wrapper = withRole('admin')
    render(<Wrapper><Orders /></Wrapper>)
    await screen.findByText(/Order #10/)

    const orderHeaders = screen.getAllByText(/Order #/i)
    const orderTexts = orderHeaders.map((el) => el.textContent)
    // Pending: oC (createdAt 1/3) then oA (1/5), then fulfilled oB
    expect(orderTexts).toEqual(['Order #12', 'Order #10', 'Order #11'])
  })
})
