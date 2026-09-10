import { login } from '@/app/auth/actions'
import Link from 'next/link'

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string, next?: string }>
}) {
  const { error, next } = await searchParams

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <h2 className="mt-6 text-center text-3xl font-bold tracking-tight" style={{ color: "var(--foreground)" }}>
          შესვლა / Login
        </h2>
        <p className="mt-2 text-center text-sm" style={{ color: "var(--foreground-muted)" }}>
          Don't have an account?{' '}
          <Link href="/register" className="font-medium hover:underline" style={{ color: "var(--brand)" }}>
            Sign up
          </Link>
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="py-8 px-4 shadow sm:rounded-lg sm:px-10 border" style={{ background: "var(--background-secondary)", borderColor: "var(--surface-border)" }}>
          <form className="space-y-6" action={login}>
            {next && <input type="hidden" name="next" value={next} />}
            
            <div>
              <label htmlFor="email" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                ელ. ფოსტა / Email
              </label>
              <div className="mt-1">
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  className="block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--surface-border)",
                    color: "var(--foreground)",
                    outlineColor: "var(--brand)"
                  }}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium" style={{ color: "var(--foreground)" }}>
                პაროლი / Password
              </label>
              <div className="mt-1">
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="current-password"
                  required
                  className="block w-full appearance-none rounded-md border px-3 py-2 shadow-sm focus:outline-none focus:ring-1 sm:text-sm"
                  style={{
                    background: "var(--background)",
                    borderColor: "var(--surface-border)",
                    color: "var(--foreground)",
                    outlineColor: "var(--brand)"
                  }}
                />
              </div>
            </div>

            {error && (
              <div className="rounded-md bg-red-900/50 p-4 border border-red-500/50">
                <div className="flex">
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-200">
                      {error}
                    </h3>
                  </div>
                </div>
              </div>
            )}

            <div>
              <button
                type="submit"
                className="flex w-full justify-center rounded-md border border-transparent py-2 px-4 text-sm font-medium text-white shadow-sm hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-offset-2 transition-opacity"
                style={{ background: "var(--brand)" }}
              >
                შესვლა / Sign in
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
}
