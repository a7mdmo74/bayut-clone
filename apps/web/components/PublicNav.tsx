'use client'
import { Heart, Menu, Moon, Sun, User } from 'lucide-react'
import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { fadeIn } from '@/lib/motion'
import { useTheme } from 'next-themes'
import { Button } from '@/components/ui/button'
import { BrandLogo } from '@/components/brand/BrandLogo'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import { Link } from '@/i18n/navigation'
import { logout } from '@/lib/auth/actions'
import { LocaleSwitcher } from '@/components/LocaleSwitcher'
import { useLocale, useTranslations } from 'next-intl'
import type { SessionUser } from '@/lib/auth/session'
import { getDashboardPath } from '@/lib/auth/redirects'
import { NotificationBell } from '@/components/NotificationBell'
import { getUserFavorites } from '@/lib/api/user'

interface PublicNavProps {
  user: SessionUser | null
}

function FavoritesHeart() {
  const [count, setCount] = useState(0)

  useEffect(() => {
    getUserFavorites()
      .then(res => {
        if (res?.data) setCount(res.data.length)
      })
      .catch(() => {})
  }, [])

  return (
    <Link
      href='/dashboard/favorites'
      className='relative hidden sm:inline-flex cursor-pointer p-2 hover:bg-muted rounded-md'
      aria-label='Favorites'
    >
      <Heart className='h-4 w-4' />
      {count > 0 && (
        <span className='absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground'>
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  )
}

export function PublicNav({ user }: PublicNavProps) {
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const t = useTranslations('nav')

  const links = [
    { to: '/buy' as const, label: t('buy') },
    { to: '/rent' as const, label: t('rent') },
    { to: '/become-agent' as const, label: t('forAgents') },
  ]

  const isAgent = user?.role === 'AGENT' || user?.role === 'AGENCY_ADMIN'
  const isAdmin = user?.role === 'ADMIN'
  const dashboardHref = getDashboardPath(user?.role)

  const handleLogout = async () => {
    await logout()
  }

  return (
    <header className='sticky top-0 z-40 border-b bg-background/85 backdrop-blur'>
      <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4'>
        <Link href='/' className='flex items-center cursor-pointer'>
          <BrandLogo variant='horizontal' className='h-8' priority />
        </Link>

        <nav className='hidden items-center gap-1 md:flex'>
          {links.map(l => (
            <Link
              key={l.label}
              href={l.to}
              className='cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground'
            >
              {l.label}
            </Link>
          ))}
        </nav>

        <div className='flex items-center gap-2'>
          <div className='hidden sm:block'>
            <LocaleSwitcher />
          </div>
          <ThemeToggle />

          {user && (
            <>
              <NotificationBell />
              <FavoritesHeart />

              <DropdownMenu>
                <DropdownMenuTrigger
                  aria-label={t('accountMenu')}
                  render={
                    <Button variant='ghost' size='icon-sm' className='hidden sm:inline-flex' />
                  }
                >
                  <User className='h-4 w-4' />
                </DropdownMenuTrigger>
                <DropdownMenuContent align='end' className='w-48'>
                  <DropdownMenuItem render={<Link href={dashboardHref} />}>
                    {t('dashboard')}
                  </DropdownMenuItem>
                  <DropdownMenuItem render={<Link href='/dashboard/favorites' />}>
                    {t('favorites')}
                  </DropdownMenuItem>
                  {isAgent && (
                    <DropdownMenuItem render={<Link href='/agent/dashboard' />}>
                      {t('agentPortal')}
                    </DropdownMenuItem>
                  )}
                  {isAdmin && (
                    <DropdownMenuItem render={<Link href='/admin/dashboard' />}>
                      {t('adminPortal')}
                    </DropdownMenuItem>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
                    {t('logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}

          {!user && (
            <div className='hidden sm:flex items-center gap-2'>
              <Link
                href='/login'
                className='cursor-pointer rounded-md px-3 py-2 text-sm font-medium text-foreground/80 hover:bg-muted hover:text-foreground'
              >
                {t('login')}
              </Link>
              <Button size='sm' render={<Link href='/register' />}>
                {t('register')}
              </Button>
            </div>
          )}

          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger
              className='cursor-pointer md:hidden'
              aria-label={t('menu')}
              render={<Button variant='ghost' size='icon-sm' className='md:hidden' />}
            >
              <Menu className='h-5 w-5' />
            </SheetTrigger>
            <SheetContent side={locale === 'ar' ? 'left' : 'right'} className='w-72'>
              <div className='mt-8 flex flex-col gap-1'>
                {links.map(l => (
                  <Link
                    key={l.label}
                    href={l.to}
                    onClick={() => setOpen(false)}
                    className='cursor-pointer rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'
                  >
                    {l.label}
                  </Link>
                ))}
                <div className='my-2 border-t' />

                {user ? (
                  <>
                    <Link
                      href={dashboardHref}
                      onClick={() => setOpen(false)}
                      className='cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted'
                    >
                      {t('dashboard')}
                    </Link>
                    <Link
                      href='/dashboard/favorites'
                      onClick={() => setOpen(false)}
                      className='cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted'
                    >
                      {t('favorites')}
                    </Link>
                    {isAgent && (
                      <Link
                        href='/agent/dashboard'
                        onClick={() => setOpen(false)}
                        className='cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted'
                      >
                        {t('agentPortal')}
                      </Link>
                    )}
                    {isAdmin && (
                      <Link
                        href='/admin/dashboard'
                        onClick={() => setOpen(false)}
                        className='cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted'
                      >
                        {t('adminPortal')}
                      </Link>
                    )}
                    <div className='my-2 border-t' />
                    <button
                      onClick={async () => {
                        await handleLogout()
                        setOpen(false)
                      }}
                      className='cursor-pointer w-full text-start rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted'
                    >
                      {t('logout')}
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      href='/login'
                      onClick={() => setOpen(false)}
                      className='cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted'
                    >
                      {t('login')}
                    </Link>
                    <Link
                      href='/register'
                      onClick={() => setOpen(false)}
                      className='cursor-pointer rounded-md px-3 py-2 text-sm hover:bg-muted'
                    >
                      {t('register')}
                    </Link>
                  </>
                )}

                <div className='mt-2'>
                  <LocaleSwitcher />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}

export function PublicFooter() {
  const t = useTranslations('footer')
  return (
    <motion.footer
      className='border-t bg-muted/40'
      variants={fadeIn}
      initial='hidden'
      whileInView='visible'
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
    >
      <div className='mx-auto grid max-w-7xl gap-8 px-4 py-12 md:grid-cols-4'>
        <div>
          <BrandLogo variant='stacked' className='h-12' />
          <p className='mt-3 text-sm text-muted-foreground'>{t('tagline')}</p>
        </div>
        <div>
          <div className='mb-3 text-sm font-semibold'>{t('buy')}</div>
          <ul className='space-y-2 text-sm text-muted-foreground'>
            <li>{t('apartmentsSale')}</li>
            <li>{t('villasSale')}</li>
            <li>{t('offPlan')}</li>
          </ul>
        </div>
        <div>
          <div className='mb-3 text-sm font-semibold'>{t('rent')}</div>
          <ul className='space-y-2 text-sm text-muted-foreground'>
            <li>{t('apartmentsRent')}</li>
            <li>{t('villasRent')}</li>
            <li>{t('shortTerm')}</li>
          </ul>
        </div>
        <div>
          <div className='mb-3 text-sm font-semibold'>{t('company')}</div>
          <ul className='space-y-2 text-sm text-muted-foreground'>
            <li>{t('about')}</li>
            <li>{t('careers')}</li>
            <li>{t('contact')}</li>
          </ul>
        </div>
      </div>
      <div className='border-t py-4 text-center text-xs text-muted-foreground'>
        {t('copyright')}
      </div>
    </motion.footer>
  )
}

function ThemeToggle() {
  const { theme, setTheme } = useTheme()

  return (
    <Button
      variant='ghost'
      size='icon-sm'
      onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
      aria-label='Toggle theme'
    >
      <Sun className='h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0' />
      <Moon className='absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100' />
    </Button>
  )
}
