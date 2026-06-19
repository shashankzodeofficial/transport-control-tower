import React from 'react'
import { Link } from 'react-router-dom'
import { ChevronRight, Home } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BreadcrumbItem } from '@/types'

interface BreadcrumbProps {
  items: BreadcrumbItem[]
  className?: string
}

export function Breadcrumb({ items, className }: BreadcrumbProps) {
  return (
    <nav
      aria-label="Breadcrumb"
      className={cn('flex h-breadcrumb items-center border-b border-slate-200 bg-white px-6', className)}
    >
      <ol className="flex items-center gap-1 text-xs text-slate-500">
        <li>
          <Link
            to="/"
            aria-label="Home"
            className="flex items-center text-slate-400 hover:text-slate-700 transition-colors"
          >
            <Home size={12} />
          </Link>
        </li>

        {items.map((item, i) => {
          const isLast = i === items.length - 1
          return (
            <React.Fragment key={i}>
              <li aria-hidden className="text-slate-300">
                <ChevronRight size={12} />
              </li>
              <li>
                {isLast || !item.href ? (
                  <span
                    aria-current={isLast ? 'page' : undefined}
                    className={cn(isLast ? 'font-medium text-slate-700' : 'text-slate-500')}
                  >
                    {item.label}
                  </span>
                ) : (
                  <Link
                    to={item.href}
                    className="text-slate-500 hover:text-slate-700 transition-colors"
                  >
                    {item.label}
                  </Link>
                )}
              </li>
            </React.Fragment>
          )
        })}
      </ol>
    </nav>
  )
}
