import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'
import { MemoryRouter } from 'react-router-dom'

test('renders dashboard heading', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText(/Compliance & Policy Dashboard/i)).toBeInTheDocument()
})
