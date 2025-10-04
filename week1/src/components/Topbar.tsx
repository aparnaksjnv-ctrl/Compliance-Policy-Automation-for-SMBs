export function Topbar({ title, authed, onSignOut }: { title: string; authed?: boolean; onSignOut?: () => void }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="actions">
        <input placeholder="Search…" aria-label="Search" />
        {authed && (
          <button onClick={onSignOut}>Sign out</button>
        )}
        <button className="primary">New</button>
      </div>
    </header>
  )
}
