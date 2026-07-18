import { Navigate, createBrowserRouter } from 'react-router-dom'
import { ProtectedRoute } from '../features/auth/components/ProtectedRoute'
import { AuthRoute } from '../routes/auth/route'
import { HomeRoute } from '../routes/home/route'

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthRoute />,
  },
  {
    path: '/',
    element: (
      <ProtectedRoute>
        <HomeRoute />
      </ProtectedRoute>
    ),
  },
  {
    path: '*',
    element: <Navigate to="/" replace />,
  },
])
