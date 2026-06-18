import { clsx } from 'clsx'

interface CardProps {
  children: React.ReactNode
  className?: string
  glass?: boolean
  onClick?: () => void
}

export default function Card({ children, className, glass, onClick }: CardProps) {
  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-2xl border border-dark-500 p-5',
        glass
          ? 'bg-dark-800/60 backdrop-blur-sm'
          : 'bg-dark-800',
        onClick && 'cursor-pointer hover:border-primary-500/50 transition-colors',
        className
      )}
    >
      {children}
    </div>
  )
}
