import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import App from './App'

test('renders dashboard heading', () => {
  render(<App />)
  expect(screen.getByText(/Compliance & Policy Dashboard/i)).toBeInTheDocument()
})
