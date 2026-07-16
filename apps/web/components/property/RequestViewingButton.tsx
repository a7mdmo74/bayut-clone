'use client'

import { useMemo, useState } from 'react'
import { useLocale, useTranslations } from 'next-intl'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { Calendar, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { requestViewing } from '@/lib/api/viewings'
import { VIEWING_POLICY } from '@repo/types'
import { useRouter } from '@/i18n/navigation'
import { cn } from '@/lib/utils'

interface RequestViewingButtonProps {
  propertyId: string
}

const TIME_SLOTS = [
  '09:00',
  '10:00',
  '11:00',
  '12:00',
  '13:00',
  '14:00',
  '15:00',
  '16:00',
  '17:00',
  '18:00',
] as const

function startOfDay(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate())
}

function sameDay(a: Date, b: Date) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}

function combineDateAndTime(date: Date, time: string) {
  const [hours, minutes] = time.split(':').map(Number)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes, 0, 0)
}

export default function RequestViewingButton({ propertyId }: RequestViewingButtonProps) {
  const [open, setOpen] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => startOfDay(new Date()))
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const t = useTranslations('viewing')
  const locale = useLocale()
  const router = useRouter()

  const minDateTime = new Date(Date.now() + VIEWING_POLICY.MIN_HOURS_AHEAD * 60 * 60 * 1000)
  const minDay = startOfDay(minDateTime)

  const calendarDays = useMemo(() => {
    const year = monthCursor.getFullYear()
    const month = monthCursor.getMonth()
    const firstOfMonth = new Date(year, month, 1)
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    // Monday-first calendar
    const startWeekday = (firstOfMonth.getDay() + 6) % 7
    const cells: Array<Date | null> = Array.from({ length: startWeekday }, () => null)
    for (let day = 1; day <= daysInMonth; day++) {
      cells.push(new Date(year, month, day))
    }
    while (cells.length % 7 !== 0) cells.push(null)
    return cells
  }, [monthCursor])

  const weekdayLabels = useMemo(() => {
    const base = new Date(2024, 0, 1) // Monday
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(base)
      d.setDate(base.getDate() + i)
      return d.toLocaleDateString(locale, { weekday: 'short' })
    })
  }, [locale])

  const availableTimes = useMemo(() => {
    if (!selectedDate) return []
    return TIME_SLOTS.filter(time => combineDateAndTime(selectedDate, time) >= minDateTime)
  }, [selectedDate, minDateTime])

  const selectedSummary =
    selectedDate && selectedTime
      ? combineDateAndTime(selectedDate, selectedTime).toLocaleString(locale, {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
          hour: 'numeric',
          minute: '2-digit',
        })
      : null

  function resetForm() {
    setSelectedDate(null)
    setSelectedTime(null)
    setError(null)
    setSuccess(false)
    setMonthCursor(startOfDay(new Date()))
  }

  function handleOpenChange(nextOpen: boolean) {
    setOpen(nextOpen)
    if (!nextOpen) resetForm()
  }

  function selectDay(day: Date) {
    if (startOfDay(day) < minDay) return
    setSelectedDate(day)
    setSelectedTime(null)
    setError(null)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedDate || !selectedTime) return

    const scheduledAt = combineDateAndTime(selectedDate, selectedTime)
    if (scheduledAt < minDateTime) {
      setError(t('minHoursNotice', { hours: VIEWING_POLICY.MIN_HOURS_AHEAD }))
      return
    }

    setLoading(true)
    setError(null)
    try {
      const result = await requestViewing(propertyId, scheduledAt.toISOString())
      if (!result?.viewing) {
        setError(t('bookingFailed'))
        setLoading(false)
        return
      }

      setSuccess(true)
      setLoading(false)
      router.refresh()
      setTimeout(() => {
        setOpen(false)
        resetForm()
        router.push('/dashboard/viewings')
      }, 1200)
    } catch (err) {
      console.error('Failed to request viewing:', err)
      setError(t('bookingFailed'))
      setLoading(false)
    }
  }

  const canGoPrevMonth =
    monthCursor.getFullYear() > minDay.getFullYear() ||
    (monthCursor.getFullYear() === minDay.getFullYear() && monthCursor.getMonth() > minDay.getMonth())

  return (
    <Sheet open={open} onOpenChange={handleOpenChange}>
      <SheetTrigger
        className='w-full'
        aria-label={t('requestViewing')}
        render={<Button className='w-full' />}
      >
        <Calendar className='me-2 h-4 w-4' />
        {t('requestViewing')}
      </SheetTrigger>
      <SheetContent className='overflow-y-auto'>
        <SheetHeader>
          <SheetTitle>{t('scheduleViewing')}</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit} className='mt-4 space-y-5'>
          <div>
            <p className='text-sm font-medium text-foreground'>{t('selectDateLabel')}</p>
            <div className='mt-3 rounded-xl border border-border bg-background p-3'>
              <div className='mb-3 flex items-center justify-between'>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  disabled={!canGoPrevMonth}
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() - 1, 1)
                    )
                  }
                  aria-label={t('previousMonth')}
                >
                  <ChevronLeft className='h-4 w-4 rtl:rotate-180' />
                </Button>
                <p className='text-sm font-semibold capitalize'>
                  {monthCursor.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}
                </p>
                <Button
                  type='button'
                  variant='ghost'
                  size='icon-sm'
                  onClick={() =>
                    setMonthCursor(
                      new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 1)
                    )
                  }
                  aria-label={t('nextMonth')}
                >
                  <ChevronRight className='h-4 w-4 rtl:rotate-180' />
                </Button>
              </div>

              <div className='mb-1 grid grid-cols-7 gap-1'>
                {weekdayLabels.map(label => (
                  <div
                    key={label}
                    className='py-1 text-center text-[11px] font-medium uppercase tracking-wide text-muted-foreground'
                  >
                    {label}
                  </div>
                ))}
              </div>

              <div className='grid grid-cols-7 gap-1'>
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className='aspect-square' />
                  }

                  const disabled = startOfDay(day) < minDay
                  const selected = selectedDate ? sameDay(day, selectedDate) : false
                  const isToday = sameDay(day, new Date())

                  return (
                    <button
                      key={day.toISOString()}
                      type='button'
                      disabled={disabled}
                      onClick={() => selectDay(day)}
                      className={cn(
                        'aspect-square rounded-lg text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        disabled && 'cursor-not-allowed text-muted-foreground/40',
                        !disabled && !selected && 'hover:bg-muted text-foreground',
                        selected && 'bg-primary text-primary-foreground hover:bg-primary',
                        !selected && isToday && 'ring-1 ring-primary/40 font-semibold'
                      )}
                    >
                      {day.getDate()}
                    </button>
                  )
                })}
              </div>
            </div>
          </div>

          <div>
            <p className='text-sm font-medium text-foreground'>{t('selectTimeLabel')}</p>
            {!selectedDate ? (
              <p className='mt-2 text-xs text-muted-foreground'>{t('pickDateFirst')}</p>
            ) : availableTimes.length === 0 ? (
              <p className='mt-2 text-xs text-muted-foreground'>{t('noTimesAvailable')}</p>
            ) : (
              <div className='mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4'>
                {availableTimes.map(time => {
                  const active = selectedTime === time
                  return (
                    <button
                      key={time}
                      type='button'
                      onClick={() => {
                        setSelectedTime(time)
                        setError(null)
                      }}
                      className={cn(
                        'rounded-lg border px-2 py-2 text-sm transition-colors',
                        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
                        active
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-border bg-background text-foreground hover:bg-muted'
                      )}
                    >
                      {time}
                    </button>
                  )
                })}
              </div>
            )}
          </div>

          {selectedSummary && (
            <div className='flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2.5 text-sm text-foreground'>
              <Clock className='mt-0.5 h-4 w-4 shrink-0 text-primary' />
              <div>
                <p className='font-medium'>{t('selectedSlot')}</p>
                <p className='text-muted-foreground'>{selectedSummary}</p>
              </div>
            </div>
          )}

          <div className='space-y-1'>
            <p className='text-xs text-muted-foreground'>
              {t('minHoursNotice', { hours: VIEWING_POLICY.MIN_HOURS_AHEAD })}
            </p>
            <p className='text-sm text-muted-foreground'>{t('freeBookingNote')}</p>
          </div>

          {error && <p className='text-sm text-destructive'>{error}</p>}
          {success && <p className='text-sm text-primary'>{t('bookingSuccess')}</p>}

          <Button
            type='submit'
            disabled={!selectedDate || !selectedTime || loading || success}
            className='w-full'
          >
            {loading ? t('processing') : t('confirmBooking')}
          </Button>
        </form>
      </SheetContent>
    </Sheet>
  )
}
