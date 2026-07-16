'use client'

import { useEffect, useState, useCallback } from 'react'
import { Bell } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { clientFetch } from '@/lib/api/client'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  link: string | null
  read: boolean
  createdAt: string
}

export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [open, setOpen] = useState(false)

  const fetchNotifications = useCallback(async () => {
    try {
      const [notifs, count] = await Promise.all([
        clientFetch<Notification[]>('/notifications'),
        clientFetch<{ count: number }>('/notifications/unread-count'),
      ])
      if (notifs) setNotifications(notifs)
      if (count) setUnreadCount(count.count)
    } catch {
      // silent
    }
  }, [])

  useEffect(() => {
    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000) // Poll every 30s
    return () => clearInterval(interval)
  }, [fetchNotifications])

  async function handleMarkAsRead(id: string) {
    try {
      await fetch(`/api/backend/notifications/${id}/read`, {
        method: 'PATCH',
        credentials: 'include',
      })
      setNotifications(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)))
      setUnreadCount(prev => Math.max(0, prev - 1))
    } catch {
      // silent
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await fetch('/api/backend/notifications/read-all', {
        method: 'PATCH',
        credentials: 'include',
      })
      setNotifications(prev => prev.map(n => ({ ...n, read: true })))
      setUnreadCount(0)
    } catch {
      // silent
    }
  }

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger
        render={
          <Button variant='ghost' size='icon-sm' className='relative' />
        }
      >
        <Bell className='h-4 w-4' />
        {unreadCount > 0 && (
          <span className='absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-[10px] text-destructive-foreground'>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align='end' className='w-80 max-h-96 overflow-y-auto'>
        <div className='flex items-center justify-between px-2 py-1.5'>
          <span className='text-sm font-semibold'>Notifications</span>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className='text-xs text-primary hover:underline'
            >
              Mark all read
            </button>
          )}
        </div>
        <DropdownMenuSeparator />
        {notifications.length === 0 ? (
          <div className='px-4 py-6 text-center text-sm text-muted-foreground'>
            No notifications yet
          </div>
        ) : (
          notifications.slice(0, 20).map(notification => (
            <DropdownMenuItem
              key={notification.id}
              onClick={() => {
                handleMarkAsRead(notification.id)
                if (notification.link) {
                  window.location.href = notification.link
                }
              }}
              className={`flex flex-col items-start gap-1 ${!notification.read ? 'bg-primary/5' : ''}`}
            >
              <div className='flex w-full items-center gap-2'>
                <span className='text-sm font-medium'>{notification.title}</span>
                {!notification.read && (
                  <span className='h-2 w-2 rounded-full bg-primary' />
                )}
              </div>
              <span className='text-xs text-muted-foreground line-clamp-2'>
                {notification.message}
              </span>
            </DropdownMenuItem>
          ))
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
