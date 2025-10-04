import { MagnifyingGlassIcon, BellIcon, UserCircleIcon } from '@heroicons/react/24/outline'

export function Topbar({ title, authed, onSignOut }: { title: string; authed?: boolean; onSignOut?: () => void }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="actions">
        <div className="hidden md:flex items-center gap-2">
          <MagnifyingGlassIcon width={18} height={18} aria-hidden="true" />
          <input className="input" placeholder="Search…" aria-label="Search" />
        </div>
        <button title="Notifications" aria-label="Notifications" className="icon-btn">
          <BellIcon width={18} height={18} />
        </button>
        {authed && (
          <button onClick={onSignOut} className="btn">
            Sign out
          </button>
        )}
        <button className="btn primary">
          New
        </button>
        <div title="Account" aria-label="Account" className="avatar" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <UserCircleIcon width={24} height={24} />
        </div>
      </div>
    </header>
  )
}
