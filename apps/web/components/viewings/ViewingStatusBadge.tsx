import { useTranslations } from 'next-intl'
import type { ViewingStatus } from '@repo/types'

interface ViewingStatusBadgeProps {
  status: ViewingStatus
}

export function ViewingStatusBadge({ status }: ViewingStatusBadgeProps) {
  const t = useTranslations('viewing')

  const statusConfig: Record<ViewingStatus, { label: string; className: string }> = {
    REQUESTED: {
      label: t('statusRequested'),
      className: 'bg-muted text-muted-foreground',
    },
    DEPOSIT_PENDING: {
      label: t('statusDepositPending'),
      className: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-500',
    },
    CONFIRMED: {
      label: t('statusConfirmed'),
      className: 'bg-primary/10 text-primary',
    },
    COMPLETED: {
      label: t('statusCompleted'),
      className: 'bg-green-500/10 text-green-600 dark:text-green-500',
    },
    CANCELED_BY_BUYER: {
      label: t('statusCanceledByBuyer'),
      className: 'bg-muted text-muted-foreground',
    },
    CANCELED_BY_AGENT: {
      label: t('statusCanceledByAgent'),
      className: 'bg-muted text-muted-foreground',
    },
    NO_SHOW: {
      label: t('statusNoShow'),
      className: 'bg-destructive/10 text-destructive',
    },
  }

  const config = statusConfig[status]

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}
    >
      {config.label}
    </span>
  )
}
