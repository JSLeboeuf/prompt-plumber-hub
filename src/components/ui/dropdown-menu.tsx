import * as React from "react"

export interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <div>{children}</div>
}

export function DropdownMenuTrigger({ children, asChild }: { children: React.ReactNode, asChild?: boolean }) {
  return <div>{children}</div>
}

export function DropdownMenuContent({ children, align, className }: { 
  children: React.ReactNode, 
  align?: string,
  className?: string 
}) {
  return (
    <div className={`bg-background border rounded-md shadow-md p-1 z-50 ${className || ''}`}>
      {children}
    </div>
  )
}

export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return <div onClick={onClick} className="px-2 py-1 hover:bg-accent cursor-pointer">{children}</div>
}

export function DropdownMenuLabel({ children }: { children: React.ReactNode }) {
  return <div className="px-2 py-1 text-sm font-medium text-muted-foreground">{children}</div>
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border my-1" />
}

export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>