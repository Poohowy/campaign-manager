import type { PropsWithChildren, ReactNode } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../components/ui/card'

type AuthFormShellProps = PropsWithChildren<{
  title: string
  description: string
  footer?: ReactNode
}>

export function AuthFormShell({ title, description, footer, children }: AuthFormShellProps) {
  return (
    <Card className="w-full max-w-md">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {children}
        {footer}
      </CardContent>
    </Card>
  )
}
