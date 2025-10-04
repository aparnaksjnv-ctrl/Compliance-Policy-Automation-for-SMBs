export function Topbar({ title }: { title: string }) {
  return (
    <header className="topbar">
      <h1>{title}</h1>
      <div className="actions">
        <input placeholder="Search…" aria-label="Search" />
        <button className="primary">New</button>
      </div>
    </header>
  )
}
