import { signOut } from '@/lib/auth'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { LogOut, Settings } from 'lucide-react'
import Link from 'next/link'
import type { Session } from 'next-auth'

type NavbarProps = {
  user: Session['user']
}

function getInitials(name?: string | null, email?: string | null) {
  if (name) return name.slice(0, 2).toUpperCase()
  if (email) return email[0].toUpperCase()
  return 'U'
}

export function Navbar({ user }: NavbarProps) {
  return (
    <header className="border-border bg-background flex h-16 shrink-0 items-center justify-between border-b px-6">
      <div />

      <DropdownMenu>
        <DropdownMenuTrigger render={<Button variant="ghost" className="h-9 w-9 rounded-full" />}>
          <Avatar className="h-9 w-9">
            <AvatarImage src={user.image ?? undefined} alt={user.name ?? 'User'} />
            <AvatarFallback>{getInitials(user.name, user.email)}</AvatarFallback>
          </Avatar>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-56">
          <div className="flex items-center justify-start gap-2 p-2">
            <div className="flex flex-col space-y-1 leading-none">
              {user.name && <p className="text-sm font-medium">{user.name}</p>}
              {user.email && (
                <p className="text-muted-foreground w-50 truncate text-xs">{user.email}</p>
              )}
            </div>
          </div>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <Link href="/settings" className="flex w-full items-center">
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem>
            <form
              className="w-full"
              action={async () => {
                'use server'
                await signOut({ redirectTo: '/sign-in' })
              }}
            >
              <button type="submit" className="flex w-full items-center">
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </button>
            </form>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </header>
  )
}
