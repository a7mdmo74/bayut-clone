'use client'

export function LoadingFallback() {
  return (
    <div className='min-h-screen bg-background'>
      {/* Header skeleton */}
      <div className='border-b border-border bg-card'>
        <div className='mx-auto flex h-16 max-w-7xl items-center justify-between px-4'>
          <div className='h-7 w-28 animate-pulse rounded bg-muted' />
          <div className='flex items-center gap-4'>
            <div className='hidden h-4 w-16 animate-pulse rounded bg-muted md:block' />
            <div className='hidden h-4 w-16 animate-pulse rounded bg-muted md:block' />
            <div className='hidden h-4 w-16 animate-pulse rounded bg-muted md:block' />
            <div className='h-8 w-8 animate-pulse rounded-full bg-muted' />
          </div>
        </div>
      </div>

      {/* Hero skeleton */}
      <div className='bg-gradient-hero py-12'>
        <div className='mx-auto max-w-7xl px-4'>
          <div className='mb-6 h-9 w-80 animate-pulse rounded bg-white/20' />
          <div className='flex gap-3'>
            <div className='h-12 flex-1 animate-pulse rounded-lg bg-white/20' />
            <div className='h-12 w-32 animate-pulse rounded-lg bg-white/20' />
          </div>
        </div>
      </div>

      {/* Content skeleton */}
      <div className='mx-auto max-w-7xl px-4 py-8'>
        <div className='mb-6 flex items-center justify-between'>
          <div className='h-4 w-32 animate-pulse rounded bg-muted' />
          <div className='h-4 w-24 animate-pulse rounded bg-muted' />
        </div>
        <div className='grid gap-5 sm:grid-cols-2 lg:grid-cols-3'>
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className='overflow-hidden rounded-xl bg-card shadow-sm'>
              <div className='aspect-4/3 animate-pulse bg-muted' />
              <div className='space-y-3 p-4'>
                <div className='flex items-center gap-2'>
                  <div className='h-5 w-16 animate-pulse rounded-full bg-muted' />
                  <div className='h-5 w-20 animate-pulse rounded-full bg-muted' />
                </div>
                <div className='h-5 w-3/4 animate-pulse rounded bg-muted' />
                <div className='h-4 w-1/2 animate-pulse rounded bg-muted' />
                <div className='flex items-center gap-4 pt-1'>
                  <div className='h-3.5 w-8 animate-pulse rounded bg-muted' />
                  <div className='h-3.5 w-8 animate-pulse rounded bg-muted' />
                  <div className='h-3.5 w-12 animate-pulse rounded bg-muted' />
                </div>
                <div className='border-t border-border pt-3'>
                  <div className='h-4 w-28 animate-pulse rounded bg-muted' />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
