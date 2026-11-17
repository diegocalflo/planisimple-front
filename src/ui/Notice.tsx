import type { ReactNode } from 'react'

interface NoticeProps {
  tone?: 'info' | 'warning' | 'error'
  children: ReactNode
}

export function Notice({ tone = 'info', children }: NoticeProps) {
  return (
    <div className={`notice notice-${tone}`} role={tone === 'error' ? 'alert' : 'status'}>
      {children}
    </div>
  )
}
