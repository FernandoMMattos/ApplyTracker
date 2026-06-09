'use client'

import { signIn } from 'next-auth/react'
import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Icons } from '@/components/icons'

export function SignInButtons() {
  const [loadingProvider, setLoadingProvider] = useState<string | null>(null)

  async function handleSignIn(provider: string) {
    setLoadingProvider(provider)
    await signIn(provider, { callbackUrl: '/dashboard' })
    setLoadingProvider(null)
  }

  return (
    <div className="space-y-3">
      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSignIn('google')}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'google' ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.google className="mr-2 h-4 w-4" />
        )}
        Continue with Google
      </Button>

      <Button
        variant="outline"
        className="w-full"
        onClick={() => handleSignIn('github')}
        disabled={loadingProvider !== null}
      >
        {loadingProvider === 'github' ? (
          <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
        ) : (
          <Icons.gitHub className="mr-2 h-4 w-4" />
        )}
        Continue with GitHub
      </Button>
    </div>
  )
}
