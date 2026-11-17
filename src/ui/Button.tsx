import type { ButtonHTMLAttributes } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary'
}

export function Button({ variant = 'primary', type = 'button', className, ...props }: ButtonProps) {
  return <button type={type} className={['button', `button-${variant}`, className].filter(Boolean).join(' ')} {...props} />
}
