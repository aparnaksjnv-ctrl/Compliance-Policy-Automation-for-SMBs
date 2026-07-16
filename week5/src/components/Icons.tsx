import React from 'react'

type IconProps = React.SVGProps<SVGSVGElement> & { size?: number }

function Svg({ size = 18, children, ...rest }: IconProps & { children: React.ReactNode }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...rest}>
      {children}
    </svg>
  )
}

export const HomeIcon = (p: IconProps) => (
  <Svg {...p}><path d="M3 10.5L12 3l9 7.5"/><path d="M9 21V12h6v9"/></Svg>
)

export const PlusIcon = (p: IconProps) => (
  <Svg {...p}><path d="M12 5v14"/><path d="M5 12h14"/></Svg>
)

export const LogoutIcon = (p: IconProps) => (
  <Svg {...p}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="M16 17l5-5-5-5"/><path d="M21 12H9"/></Svg>
)

export const SettingsIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09a1.65 1.65 0 0 0-1-1.51 1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09a1.65 1.65 0 0 0 1.51-1 1.65 1.65 0 0 0-.33-1.82l-.06-.06A2 2 0 1 1 7.04 3.7l.06.06c.48.48 1.18.63 1.82.33A1.65 1.65 0 0 0 10.42 3H10a2 2 0 1 1 4 0v.09c0 .67.39 1.28 1 1.51.64.3 1.34.15 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06c-.48.48-.63 1.18-.33 1.82.23.61.84 1 1.51 1H21a2 2 0 1 1 0 4h-.09c-.67 0-1.28.39-1.51 1z"/></Svg>
)

export const RocketIcon = (p: IconProps) => (
  <Svg {...p}><path d="M5 15c-1.5 1.5-2 4-2 4s2.5-.5 4-2 2-4 2-4-2.5.5-4 2z"/><path d="M15 9l6-6"/><path d="M16 8c-2.5-2.5-7-2.5-9.5 0L3 11.5 12.5 21l3.5-3.5c2.5-2.5 2.5-7 0-9.5z"/></Svg>
)

export const FileIcon = (p: IconProps) => (
  <Svg {...p}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><path d="M14 2v6h6"/></Svg>
)

export const RefreshIcon = (p: IconProps) => (
  <Svg {...p}><path d="M21 12a9 9 0 1 1-2.64-6.36"/><path d="M21 3v6h-6"/></Svg>
)

export const MoonIcon = (p: IconProps) => (
  <Svg {...p}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></Svg>
)

export const SunIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"/></Svg>
)

export const SearchIcon = (p: IconProps) => (
  <Svg {...p}><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></Svg>
)
