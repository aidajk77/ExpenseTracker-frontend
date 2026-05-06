import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface PublicRouteProps {
  element: React.ReactElement
}

export function PublicRoute({ element }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>
  }

  return isAuthenticated ? <Navigate to="/dashboard" replace /> : element
}