export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const next = params.next ?? "/";
  const hasError = params.error === "1";

  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-sm bg-white rounded-lg shadow p-6 border border-slate-200">
        <h1 className="text-xl font-semibold mb-1">Property Ledger</h1>
        <p className="text-sm text-slate-500 mb-6">Enter the site password to continue.</p>
        <form method="POST" action="/api/login" className="space-y-4">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="password" className="block text-sm font-medium mb-1">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              autoFocus
              required
              className="w-full rounded border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-slate-400"
            />
          </div>
          {hasError && (
            <p className="text-sm text-red-600">Incorrect password. Try again.</p>
          )}
          <button
            type="submit"
            className="w-full rounded bg-slate-900 text-white py-2 font-medium hover:bg-slate-700"
          >
            Sign in
          </button>
        </form>
      </div>
    </main>
  );
}
