import { createBrowserRouter } from 'react-router-dom'
import { HomeRoute } from '../routes/home/route'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <HomeRoute />,
  },
])
