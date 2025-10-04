import { MagnifyingGlassIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'

export function Topbar({ title, authed, onSignOut }: { title: string; authed?: boolean; onSignOut?: () => void }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="actions" style={{ gap: 12 }}>
        <div className="hidden md:flex items-center gap-2" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <MagnifyingGlassIcon width={18} height={18} aria-hidden="true" />
          <input placeholder="Search…" aria-label="Search" />
        </div>
        <button title="Notifications" aria-label="Notifications" className="icon-btn" style={{ background: 'transparent', border: '1px solid #1f2937', borderRadius: 8, padding: 6 }}>
          <BellIcon width={18} height={18} />
        </button>
        {authed && (
          <button onClick={onSignOut} className="" style={{ background: 'transparent', border: '1px solid #1f2937', color: 'var(--text)', padding: '8px 12px', borderRadius: 8 }}>
            Sign out
          </button>
        )}
        <button className="primary" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          New
        </button>
        <div title="Account" aria-label="Account" className="avatar" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserCircleIcon width={24} height={24} />
        </div>
      </div>
    </header>
  )
}
