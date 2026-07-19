import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { PublicOnlyRoute } from '../features/auth/components/PublicOnlyRoute'
import { ForgotPasswordRoute } from '../routes/auth/forgot-password'
import { LoginRoute } from '../routes/auth/login'
import { RegisterRoute } from '../routes/auth/register'
import { AuthRoute } from '../routes/auth/route'
import { CustomersRoute } from '../routes/customers/route'
import { DashboardRoute } from '../routes/dashboard/route'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: (
      <PublicOnlyRoute>
        <AuthRoute />
      </PublicOnlyRoute>
    ),
    children: [
      {
        index: true,
        element: <Navigate to="/auth/login" replace />,
      },
      {
        path: 'login',
        element: <LoginRoute />,
      },
      {
        path: 'register',
        element: <RegisterRoute />,
      },
      {
        path: 'forgot-password',
        element: <ForgotPasswordRoute />,
      },
    ],
  },
  {
    path: '/',
    element: <Navigate to="/dashboard" replace />,
  },
  {
    path: '/dashboard',
    element: (
      <ProtectedRoute>
        <DashboardRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: '/customers',
    element: (
      <ProtectedRoute>
        <CustomersRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/dashboard" replace />,
  },
])
