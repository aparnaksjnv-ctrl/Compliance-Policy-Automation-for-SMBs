export function Skeleton({ className = '' }: { className?: string }) {
  return <div className={[
    'animate-pulse bg-slate-700/60 rounded',
    className,
  ].filter(Boolean).join(' ')} />
}
