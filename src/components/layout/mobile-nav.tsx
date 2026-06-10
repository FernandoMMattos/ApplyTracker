'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { MenuIcon, Briefcase, LayoutDashboard, BarChart2, Settings, XIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent } from '@/components/ui/sheet'

const navItems = [
  { href: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications' as const, label: 'Applications', icon: Briefcase },
  { href: '/analytics' as const, label: 'Analytics', icon: BarChart2 },
  { href: '/settings' as const, label: 'Settings', icon: Settings },
]

export function MobileNav() {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()

  return (
    <>
      <Button
        variant="ghost"
        size="icon-sm"
        className="md:hidden"
        aria-label="Open navigation"
        onClick={() => setOpen(true)}
      >
        <MenuIcon />
      </Button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-60 p-0">
          <div className="border-border flex h-16 items-center border-b px-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-2 font-bold"
              onClick={() => setOpen(false)}
            >
              <Briefcase className="text-primary h-5 w-5" />
              <span>ApplyTrack</span>
            </Link>
            <Button
              variant="ghost"
              size="icon-sm"
              className="ml-auto"
              onClick={() => setOpen(false)}
              aria-label="Close navigation"
            >
              <XIcon />
            </Button>
          </div>

          <nav className="space-y-1 px-3 py-4">
            {navItems.map(({ href, label, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  pathname === href
                    ? 'bg-accent text-accent-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground',
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
