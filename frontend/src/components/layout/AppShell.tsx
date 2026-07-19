import type { PropsWithChildren } from 'react'
import { NavLink } from 'react-router-dom'
import { cn } from '../../shared/utils/cn'

const primaryItems = [
  { label: 'Dashboard', to: '/dashboard' },
  { label: 'Customers', to: '/customers' },
  { label: 'Templates', to: '/templates' },
]

const disabledItems = ['Campaigns', 'SMTP']

export function AppShell({ children }: PropsWithChildren) {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center px-6">
          <h1 className="text-lg font-semibold">Campaign Manager</h1>
        </div>
      </header>
      <div className="mx-auto grid w-full max-w-7xl gap-6 px-6 py-8 md:grid-cols-[220px_1fr]">
        <aside className="rounded-lg border border-slate-200 bg-white p-3">
          <nav className="space-y-1">
            {primaryItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  cn(
                    'block rounded-md px-3 py-2 text-sm transition-colors',
                    isActive
                      ? 'bg-slate-900 text-white'
                      : 'text-slate-700 hover:bg-slate-100 hover:text-slate-900',
                  )
                }
              >
                {item.label}
              </NavLink>
            ))}
            {disabledItems.map((item) => (
              <div key={item} className="rounded-md px-3 py-2 text-sm text-slate-400">
                {item}
              </div>
            ))}
          </nav>
        </aside>
        <main>{children}</main>
      </div>
    </div>
  )
}
