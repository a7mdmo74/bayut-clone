'use client'

import { useState, useEffect } from 'react'
import { ExternalLink } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Badge } from '@/components/ui/badge'
import { Card } from '@/components/ui/card'
import { Link } from '@/i18n/navigation'
import { clientFetch } from '@/lib/api/client'
import type { AgentTransaction } from '@/lib/api/payments-server'

const statusColors: Record<string, string> = {
  CAPTURED: 'bg-green-100 text-green-800',
  PENDING: 'bg-yellow-100 text-yellow-800',
  REFUNDED: 'bg-blue-100 text-blue-800',
  FAILED: 'bg-red-100 text-red-800',
  CANCELED: 'bg-gray-100 text-gray-800',
}

export function AgentTransactionsClient() {
  const t = useTranslations('agentTransactions')
  const [transactions, setTransactions] = useState<AgentTransaction[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      try {
        const data = await clientFetch<{ data: AgentTransaction[] }>('/payments/agent-transactions')
        if (data) {
          setTransactions(data.data)
        }
      } catch (error) {
        console.error('Failed to fetch transactions:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchTransactions()
  }, [])

  if (loading) {
    return <div className='mx-auto max-w-7xl px-4 py-10'>Loading...</div>
  }

  return (
    <div className='mx-auto max-w-7xl px-4 py-10'>
      <div className='mb-8'>
        <h1 className='text-2xl font-bold'>{t('title')}</h1>
        <p className='mt-1 text-sm text-muted-foreground'>{t('description')}</p>
      </div>

      {transactions.length === 0 ? (
        <Card className='p-12 text-center text-muted-foreground'>
          {t('empty')}
        </Card>
      ) : (
        <div className='space-y-4'>
          {transactions.map(tx => (
            <Card key={tx.id} className='p-6'>
              <div className='flex items-start gap-4'>
                {tx.propertyImage && (
                  <img
                    src={tx.propertyImage}
                    alt={tx.propertyTitle ?? ''}
                    className='h-20 w-20 rounded-md object-cover'
                  />
                )}
                <div className='flex-1 min-w-0'>
                  <div className='flex items-start justify-between gap-4'>
                    <div className='min-w-0'>
                      <h3 className='font-semibold truncate'>{tx.propertyTitle}</h3>
                      <p className='text-sm text-muted-foreground'>
                        AED {tx.propertyPrice.toLocaleString()}
                      </p>
                    </div>
                    <Badge className={statusColors[tx.status] ?? 'bg-gray-100 text-gray-800'}>
                      {tx.status}
                    </Badge>
                  </div>

                  <div className='mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2 text-sm'>
                    <div>
                      <span className='text-muted-foreground'>{t('buyer')}: </span>
                      <span className='font-medium'>{tx.buyerName}</span>
                    </div>
                    <div>
                      <span className='text-muted-foreground'>{t('email')}: </span>
                      <span className='font-medium'>{tx.buyerEmail}</span>
                    </div>
                    {tx.buyerPhone && (
                      <div>
                        <span className='text-muted-foreground'>{t('phone')}: </span>
                        <span className='font-medium'>{tx.buyerPhone}</span>
                      </div>
                    )}
                  </div>

                  <div className='mt-3 flex items-center justify-between text-sm text-muted-foreground'>
                    <span>
                      {t('amount')}: AED {tx.amountAed.toLocaleString()}
                    </span>
                    <span>
                      {t('date')}: {new Date(tx.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {tx.propertySlug && (
                  <Link
                    href={`/properties/${tx.propertySlug}`}
                    className='shrink-0 text-muted-foreground hover:text-foreground'
                    target='_blank'
                  >
                    <ExternalLink className='h-4 w-4' />
                  </Link>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
