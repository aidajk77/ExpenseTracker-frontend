import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom'
import './App.css'
import { AuthProvider } from './context/AuthContext'
import { useAuth } from './hooks/useAuth'
import { TopNav } from './components/layout/topNav'
import { ProtectedRoute } from './components/ProtectedRoute'
import Budgets from './pages/budgets'
import Dashboard from './pages/dashboard'
import Profile from './pages/profile'
import Savings from './pages/savings'
import Transactions from './pages/transactions'
import Login from './pages/login'
import Register from './pages/register'
import { PublicRoute } from './components/PublicRoute'
import { ThemeProvider } from './context/ThemeContext'
import { CurrencyProvider } from './context/CurrencyContext'

function AppContent() {
  const { isAuthenticated, isLoading } = useAuth()

  if (isLoading) {
    return <div className='flex items-center justify-center min-h-screen'>Loading...</div>
  }

  return (
    <div>
      {isAuthenticated && <TopNav />}

      <Routes>
        <Route path='/login' element={<PublicRoute element={<Login />} />} />
        <Route path='/register' element={<PublicRoute element={<Register />} />} />
        <Route path='/dashboard' element={<ProtectedRoute element={<Dashboard />} />} />
        <Route path='/transactions' element={<ProtectedRoute element={<Transactions />} />} />
        <Route path='/budgets' element={<ProtectedRoute element={<Budgets />} />} />
        <Route path='/savings' element={<ProtectedRoute element={<Savings />} />} />
        <Route path='/profile' element={<ProtectedRoute element={<Profile />} />} />
        <Route path='/' element={<Navigate to='/dashboard' replace />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CurrencyProvider>
          <Router>
            <AppContent />
          </Router>
        </CurrencyProvider>
      
      </AuthProvider>
    </ThemeProvider>
    
  )
}

export default App