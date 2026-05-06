import { Navigate } from 'react-router-dom'
import { useAuth } from '@/hooks/useAuth'

interface ProtectedRouteProps {
  element: React.ReactElement
}

export function ProtectedRoute({ element }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>
  }

  return isAuthenticated ? element : <Navigate to="/login" replace />
}