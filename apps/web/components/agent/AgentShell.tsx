'use client'

import { Menu, User } from 'lucide-react'
import { useState } from 'react'
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

export function AgentShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const locale = useLocale()
  const t = useTranslations('agentNav')

  const links = [
    { to: '/agent/dashboard' as const, label: t('dashboard') },
    { to: '/agent/properties' as const, label: t('properties') },
    { to: '/agent/transactions' as const, label: t('transactions') },
    { to: '/agent/viewings' as const, label: t('viewings') },
  ]

  const handleLogout = async () => {
    await logout()
  }

  return (
    <div className='min-h-screen bg-muted/30'>
      <header className='sticky top-0 z-40 border-b bg-background/85 backdrop-blur'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4'>
          <Link href='/agent/dashboard' className='flex items-center gap-2'>
            <BrandLogo variant='horizontal' className='h-8' />
            <span className='rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary'>
              {t('agent')}
            </span>
          </Link>
          <nav className='hidden items-center gap-1 md:flex'>
            {links.map(l => (
              <Link
                key={l.label}
                href={l.to}
                className='rounded-md px-3 py-2 text-sm font-medium text-foreground/80 transition hover:bg-muted hover:text-foreground'
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className='flex items-center gap-2'>
            <div className='hidden sm:block'>
              <LocaleSwitcher />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger className='hidden sm:inline-flex'>
                <User className='h-4 w-4' />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-48'>
                <DropdownMenuItem render={<Link href='/agent/dashboard' />}>
                  {t('dashboard')}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem render={<Link href='/' />}>{t('backToSite')}</DropdownMenuItem>
                <DropdownMenuItem onClick={handleLogout} className='text-destructive'>
                  {t('logout')}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Sheet open={open} onOpenChange={setOpen}>
              <SheetTrigger className='cursor-pointer'>
                <Menu className='h-5 w-5' />
              </SheetTrigger>
              <SheetContent side={locale === 'ar' ? 'left' : 'right'} className='w-72'>
                <div className='mt-8 flex flex-col gap-1'>
                  {links.map(l => (
                    <Link
                      key={l.label}
                      href={l.to}
                      onClick={() => setOpen(false)}
                      className='rounded-md px-3 py-2 text-sm font-medium hover:bg-muted'
                    >
                      {l.label}
                    </Link>
                  ))}
                  <div className='my-2 border-t' />
                  <Link
                    href='/'
                    onClick={() => setOpen(false)}
                    className='rounded-md px-3 py-2 text-sm hover:bg-muted'
                  >
                    {t('backToSite')}
                  </Link>
                  <button
                    onClick={async () => {
                      await handleLogout()
                      setOpen(false)
                    }}
                    className='w-full text-start rounded-md px-3 py-2 text-sm text-destructive hover:bg-muted'
                  >
                    {t('logout')}
                  </button>
                  <div className='mt-2'>
                    <LocaleSwitcher />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>
      {children}
    </div>
  )
}
