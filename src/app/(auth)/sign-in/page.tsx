import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { SignInButtons } from '@/components/auth/sign-in-buttons'

export default async function SignInPage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="bg-background flex min-h-screen items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold tracking-tight">ApplyTrack</h1>
          <p className="text-muted-foreground text-sm">
            Track your job applications. Get AI-powered insights.
          </p>
        </div>

        <SignInButtons />

        <p className="text-muted-foreground text-center text-xs">
          By signing in, you agree to our Terms of Service and Privacy Policy.
        </p>
      </div>
    </div>
  )
}
