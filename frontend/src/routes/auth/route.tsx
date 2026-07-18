import { Outlet } from 'react-router-dom'

export function AuthRoute() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 p-4 sm:p-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center gap-6">
        <div className="space-y-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Campaign Manager</h1>
          <p className="text-sm text-slate-600">Secure access for your email operations workspace.</p>
        </div>
        <Outlet />
      </div>
    </div>
  )
}
