import * as React from "react"
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

export interface DropdownMenuProps {
  children: React.ReactNode
}

export function DropdownMenu({ children }: DropdownMenuProps) {
  return <div>{children}</div>
}

export function DropdownMenuTrigger({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>
}

export function DropdownMenuContent({ children }: { children: React.ReactNode }) {
  return <div className="bg-background border rounded-md shadow-md p-1">{children}</div>
}

export function DropdownMenuItem({ children, onClick }: { children: React.ReactNode, onClick?: () => void }) {
  return <div onClick={onClick} className="px-2 py-1 hover:bg-accent cursor-pointer">{children}</div>
}

export function DropdownMenuSeparator() {
  return <div className="h-px bg-border my-1" />
}

export const DropdownMenuPortal = ({ children }: { children: React.ReactNode }) => <>{children}</>