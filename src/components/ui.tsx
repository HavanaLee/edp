import { cn } from '@/lib/utils'
import type { ReactNode } from 'react'

export function Card({
  children,
  className,
  title,
  extra,
}: {
  children: ReactNode
  className?: string
  title?: string
  extra?: ReactNode
}) {
  return (
    <section
      className={cn(
        'rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 shadow-sm',
        className,
      )}
    >
      {(title || extra) && (
        <header className="mb-3 flex items-center justify-between gap-2">
          {title ? <h3 className="text-sm font-semibold text-[var(--text)]">{title}</h3> : <span />}
          {extra}
        </header>
      )}
      {children}
    </section>
  )
}

export function KpiCard({
  label,
  value,
  hint,
  accent,
}: {
  label: string
  value: string | number
  hint?: string
  accent?: string
}) {
  return (
    <Card className="min-w-0">
      <div className="text-xs text-[var(--text-muted)]">{label}</div>
      <div className="mt-2 text-3xl font-semibold tracking-tight" style={{ color: accent }}>
        {value}
      </div>
      {hint ? <div className="mt-2 text-xs text-[var(--text-muted)]">{hint}</div> : null}
    </Card>
  )
}

export function Badge({
  children,
  tone = 'info',
}: {
  children: ReactNode
  tone?: 'info' | 'success' | 'warn' | 'danger' | 'neutral'
}) {
  const map = {
    info: 'bg-sky-500/15 text-sky-300',
    success: 'bg-emerald-500/15 text-emerald-300',
    warn: 'bg-amber-500/15 text-amber-300',
    danger: 'bg-rose-500/15 text-rose-300',
    neutral: 'bg-slate-500/15 text-slate-300',
  }
  return (
    <span className={cn('inline-flex rounded-md px-2 py-0.5 text-xs font-medium', map[tone])}>
      {children}
    </span>
  )
}

export function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-800">
      <div
        className="h-full rounded-full bg-[var(--accent)] transition-all"
        style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
      />
    </div>
  )
}

export function PageHeader({
  title,
  subtitle,
  actions,
}: {
  title: string
  subtitle?: string
  actions?: ReactNode
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="text-xl font-semibold">{title}</h1>
        {subtitle ? <p className="mt-1 text-sm text-[var(--text-muted)]">{subtitle}</p> : null}
      </div>
      {actions}
    </div>
  )
}

export function EmptyState({ text }: { text: string }) {
  return (
    <div className="rounded-lg border border-dashed border-[var(--border)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
      {text}
    </div>
  )
}

export function LoadingBlock() {
  return (
    <div className="animate-pulse rounded-lg border border-[var(--border)] bg-[var(--bg-panel)] px-4 py-10 text-center text-sm text-[var(--text-muted)]">
      加载中…
    </div>
  )
}
