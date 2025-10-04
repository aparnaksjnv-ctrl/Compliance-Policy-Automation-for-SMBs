import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import { Dashboard } from './Dashboard'

test('renders KPI cards and recent activity list', () => {
  render(<Dashboard />)

  // KPI cards
  expect(screen.getByText(/Open Issues/i)).toBeInTheDocument()
  expect(screen.getByText('12')).toBeInTheDocument()

  expect(screen.getByText(/Policy Coverage/i)).toBeInTheDocument()
  expect(screen.getByText('87%')).toBeInTheDocument()

  expect(screen.getByText(/Upcoming Audits/i)).toBeInTheDocument()
  expect(screen.getByText('3')).toBeInTheDocument()

  // Recent activity section
  expect(screen.getByText(/Recent Activity/i)).toBeInTheDocument()
})
