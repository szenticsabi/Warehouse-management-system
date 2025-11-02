import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import Products from '../components/Products.jsx'
import axios from 'axios'

vi.mock('axios', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}))

function mockProducts(list) {
  axios.get.mockResolvedValueOnce({ data: { success: true, data: list } })
}

describe('Products', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
    localStorage.clear()
    // Default token (optional)
    localStorage.setItem('pos-token', 't')
  })

  it('filters by search query', async () => {
    mockProducts([
      { _id: '1', name: 'Alpha', sku: 'A1', price: 100, stock: 10, category: { name: 'Cat1' }, warehouse: { name: 'WH1' } },
      { _id: '2', name: 'Beta', sku: 'B2', price: 200, stock: 5, category: { name: 'Cat2' }, warehouse: { name: 'WH2' } },
    ])

    render(<Products />)

    // Wait list
    await screen.findByText(/products?$/i)

    const input = screen.getByPlaceholderText(/search by name\/sku\/category\/warehouse/i)
    fireEvent.change(input, { target: { value: 'alp' } })

    expect(await screen.findByText('Alpha')).toBeInTheDocument()
    expect(screen.queryByText('Beta')).toBeNull()
  })

  it('marks low stock rows with red background', async () => {
    mockProducts([
      { _id: '1', name: 'Low', sku: 'L', price: 100, stock: 3 },
      { _id: '2', name: 'Ok', sku: 'O', price: 100, stock: 12 },
    ])

    render(<Products />)
    const lowRowName = await screen.findByText('Low')
    const li = lowRowName.closest('li')
    expect(li?.className || '').toMatch(/bg-red-100\/80/)

    const okRowName = screen.getByText('Ok')
    const li2 = okRowName.closest('li')
    expect(li2?.className || '').not.toMatch(/bg-red-100\/80/)
  })

  it('checkboxes per row and select all work', async () => {
    mockProducts([
      { _id: '1', name: 'P1', stock: 1 },
      { _id: '2', name: 'P2', stock: 2 },
    ])
    render(<Products />)
    await screen.findByText('P1')

    const rowCbs = [
      screen.getByLabelText('Select P1'),
      screen.getByLabelText('Select P2'),
    ]
    // Header checkbox is the one without aria-label
    const allCbs = screen.getAllByRole('checkbox')
    const headerCb = allCbs.find((cb) => !cb.getAttribute('aria-label'))

    // Select all
    if (!headerCb) throw new Error('header checkbox not found')
    fireEvent.click(headerCb)
    rowCbs.forEach((cb) => expect(cb).toBeChecked())

    // Toggle one off
    fireEvent.click(rowCbs[0])
    expect(rowCbs[0]).not.toBeChecked()
    expect(rowCbs[1]).toBeChecked()
  })

  it('Send to To-Order posts selected ids', async () => {
    mockProducts([
      { _id: '1', name: 'P1', stock: 1 },
      { _id: '2', name: 'P2', stock: 2 },
      { _id: '3', name: 'P3', stock: 10 },
    ])
    axios.post.mockResolvedValueOnce({ data: { success: true, message: 'ok' } })

    render(<Products />)
    await screen.findByText('P1')

    fireEvent.click(screen.getByLabelText('Select P1'))
    fireEvent.click(screen.getByLabelText('Select P2'))
    fireEvent.click(screen.getByRole('button', { name: /send to to-order/i }))

    await waitFor(() => expect(axios.post).toHaveBeenCalled())
    const [url, body] = axios.post.mock.calls[0]
    expect(String(url)).toMatch(/\/api\/toorder\/add-selection$/)
    expect(body).toEqual({ ids: ['1', '2'] })
  })
})
