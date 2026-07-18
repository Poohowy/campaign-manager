import { cva, type VariantProps } from 'class-variance-authority'
import type * as React from 'react'
import { cn } from '../../shared/utils/cn'

const alertVariants = cva('relative w-full rounded-lg border px-4 py-3 text-sm', {
  variants: {
    variant: {
      default: 'border-slate-200 bg-slate-50 text-slate-700',
      destructive: 'border-red-200 bg-red-50 text-red-700',
      success: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
})

export function Alert({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof alertVariants>) {
  return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />
}
