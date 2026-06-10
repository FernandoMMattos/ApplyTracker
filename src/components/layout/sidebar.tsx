import Link from 'next/link'
import { LayoutDashboard, Briefcase, BarChart2, Settings } from 'lucide-react'
import { cn } from '@/lib/utils'

const navItems = [
  { href: '/dashboard' as const, label: 'Dashboard', icon: LayoutDashboard },
  { href: '/applications' as const, label: 'Applications', icon: Briefcase },
  { href: '/analytics' as const, label: 'Analytics', icon: BarChart2 },
  { href: '/settings' as const, label: 'Settings', icon: Settings },
]

export function Sidebar() {
  return (
    <aside className="border-border bg-card hidden w-60 flex-shrink-0 border-r md:flex md:flex-col">
      <div className="border-border flex h-16 items-center border-b px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-bold">
          <Briefcase className="text-primary h-5 w-5" />
          <span>ApplyTrack</span>
        </Link>
      </div>

      <nav className="flex-1 space-y-1 px-3 py-4">
        {navItems.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={cn(
              'text-muted-foreground hover:bg-accent hover:text-accent-foreground flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
            )}
          >
            <Icon className="h-4 w-4" />
            {label}
          </Link>
        ))}
      </nav>
    </aside>
  )
}
