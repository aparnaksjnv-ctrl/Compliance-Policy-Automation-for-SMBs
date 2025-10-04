import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'
import { MemoryRouter } from 'react-router-dom'

test('default route renders dashboard', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )
  expect(screen.getByText(/Compliance & Policy Dashboard/i)).toBeInTheDocument()
})

test('navigates to Policies and Audits via sidebar', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  )

  // Policies
  fireEvent.click(screen.getByRole('button', { name: /Policies/i }))
  expect(screen.getByText(/Policies list coming soon/i)).toBeInTheDocument()

  // Audits
  fireEvent.click(screen.getByRole('button', { name: /Audits/i }))
  expect(screen.getByText(/Audit schedule coming soon/i)).toBeInTheDocument()
})
