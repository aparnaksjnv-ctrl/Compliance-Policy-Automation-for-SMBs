import { useLocation, useNavigate } from 'react-router-dom'
import { Squares2X2Icon, DocumentTextIcon, ClipboardDocumentCheckIcon, Cog6ToothIcon } from '@heroicons/react/24/outline'

export function Sidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const path = location.pathname
  const isActive = (p: string) => (p === '/' ? path === '/' : path.startsWith(p))

  const items = [
    { label: 'Dashboard', path: '/', Icon: Squares2X2Icon },
    { label: 'Policies', path: '/policies', Icon: DocumentTextIcon },
    { label: 'Audits', path: '/audits', Icon: ClipboardDocumentCheckIcon },
    { label: 'Settings', path: '/settings', Icon: Cog6ToothIcon },
  ]

  return (
    <aside className="sidebar">
      <div className="logo">C&P</div>
      <nav>
        {items.map(({ label, path: p, Icon }) => (
          <button
            key={p}
            className={isActive(p) ? 'active' : ''}
            onClick={() => navigate(p)}
            aria-current={isActive(p) ? 'page' : undefined}
            style={{ display: 'flex', alignItems: 'center', gap: 8 }}
          >
            <Icon width={18} height={18} aria-hidden="true" />
            {label}
          </button>
        ))}
      </nav>
    </aside>
  )
}
