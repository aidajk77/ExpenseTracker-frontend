import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import userService from '@/api/userService'
import { useAuth } from '@/hooks/useAuth'

export function ProfileDropdown() {
  const navigate = useNavigate()
  const { logout, user } = useAuth()
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  //  Fetch current user data
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

  const handleSignOut = () => {
    logout()
    navigate('/login')
  }

  //  Get user initials for avatar fallback
  const getInitials = () => {
    if (!currentUser?.username) return 'U'
    return currentUser.username.charAt(0).toUpperCase()
  }

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <Button variant='ghost' className='relative h-8 w-8 rounded-full'>
          <Avatar className='h-8 w-8'>
            <AvatarImage src={currentUser?.avatar} alt={currentUser?.username} />
            <AvatarFallback className='bg-blue-100 text-blue-600 font-bold'>
              {loading ? 'U' : getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className='w-56' align='end' forceMount>
        {/*  Display real user data */}
        <DropdownMenuLabel className='font-normal'>
          <div className='flex flex-col gap-1.5'>
            <p className='text-sm leading-none font-medium'>
              {loading ? 'Loading...' : currentUser?.username || 'User'}
            </p>
            <p className='text-xs leading-none text-muted-foreground truncate'>
              {loading ? '...' : currentUser?.email || 'No email'}
            </p>
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem asChild>
            <button onClick={() => navigate('/profile')} className='w-full text-left cursor-pointer'>
              Profile
            </button>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <button onClick={handleSignOut} className='w-full text-left cursor-pointer text-red-600'>
            Sign out
          </button>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}