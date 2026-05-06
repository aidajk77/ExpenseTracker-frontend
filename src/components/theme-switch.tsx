import { useEffect } from 'react'
import { Moon, Sun } from 'lucide-react'
import { useTheme } from '@/hooks/useTheme'
import { Button } from '@/components/ui/button'

export function ThemeSwitch() {
  const { theme, toggleTheme } = useTheme()

  /* Update theme-color meta tag when theme is updated */
  useEffect(() => {
    const themeColor = theme === 'dark' ? '#020817' : '#fff'
    const metaThemeColor = document.querySelector("meta[name='theme-color']")
    if (metaThemeColor) metaThemeColor.setAttribute('content', themeColor)
  }, [theme])

  return (
    <Button
      variant='ghost'
      size='icon'
      onClick={toggleTheme}
      className='scale-95 rounded-full'
      aria-label='Toggle theme'
    >
      {/*  Show Sun when in light mode, Moon when in dark mode */}
      {theme === 'light' ? (
        <Sun className='size-[1.2rem] transition-all' />
      ) : (
        <Moon className='size-[1.2rem] transition-all' />
      )}
    </Button>
  )
}