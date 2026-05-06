import { Menu } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from '@/components/ui/dropdown-menu'
import { ProfileDropdown } from './profile-dropdown'
import { ThemeSwitch } from '../theme-switch'
import { useAuth } from '@/hooks/useAuth'
import { useState, useEffect } from 'react'
import userService from '@/api/userService'

export function TopNav() {
  const location = useLocation()
  const { logout } = useAuth()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      try {
        setLoading(true)
        const userData = await userService.getCurrentUser()
        setCurrentUser(userData)
      } catch (err) {
        console.error('Failed to fetch user:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [])

  const navLinks = [
    { title: 'Dashboard', href: '/dashboard' },
    { title: 'Transactions', href: '/transactions' },
    { title: 'Budgets', href: '/budgets' },
    { title: 'Savings', href: '/savings' },
  ]

  const isActive = (href: string) => location.pathname === href

  //  Get user initials
  const getInitials = () => {
    if (!currentUser?.username) return 'U'
    return currentUser.username.charAt(0).toUpperCase()
  }

  //  Handle sign out
  const handleSignOut = () => {
    logout()
    window.location.href = '/login'
  }

  return (
    <>
      {/* Mobile Menu */}
      <div className='lg:hidden flex items-center justify-between px-4 py-3 border-b border-border bg-background'>
        <DropdownMenu modal={false}>
          <DropdownMenuTrigger asChild>
            <Button size='icon' variant='outline' className='size-8'>
              <Menu className='size-5' />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent side='bottom' align='start' className='w-48'>
            {/* Navigation Links */}
            {navLinks.map(({ title, href }) => (
              <DropdownMenuItem key={href} asChild>
                <Link
                  to={href}
                  className={cn(
                    'w-full cursor-pointer',
                    !isActive(href) ? 'text-muted-foreground' : 'font-semibold'
                  )}
                >
                  {title}
                </Link>
              </DropdownMenuItem>
            ))}

            <DropdownMenuSeparator />

            {/* User Info */}
            <DropdownMenuLabel className='font-normal'>
              <div className='flex flex-col gap-1'>
                <p className='text-sm font-medium'>
                  {loading ? 'Loading...' : currentUser?.username || 'User'}
                </p>
                <p className='text-xs text-muted-foreground truncate'>
                  {loading ? '...' : currentUser?.email || 'No email'}
                </p>
              </div>
            </DropdownMenuLabel>

            <DropdownMenuSeparator />

            {/* Profile & Sign Out */}
            <DropdownMenuItem asChild>
              <Link to='/profile' className='w-full cursor-pointer'>
                Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <button 
                onClick={handleSignOut} 
                className='w-full text-left cursor-pointer text-red-600'
              >
                Sign out
              </button>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Right side - Theme switch (mobile) */}
        <ThemeSwitch />
      </div>

      {/* Desktop Menu */}
      <nav className='hidden items-center justify-between lg:flex w-full bg-background text-foreground border-b border-border px-6 py-4'>
        {/* Left side - Navigation links */}
        <div className='flex items-center space-x-6'>
          {navLinks.map(({ title, href }) => (
            <Link
              key={href}
              to={href}
              className={cn(
                'text-sm font-medium transition-colors hover:text-primary px-3 py-2 rounded',
                isActive(href)
                  ? 'text-foreground font-semibold'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {title}
            </Link>
          ))}
        </div>

        {/* Right side - Theme & Profile */}
        <div className='flex items-center gap-2'>
          <ThemeSwitch />
          <ProfileDropdown />
        </div>
      </nav>
    </>
  )
}