export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--color-bg)] px-6">
      <div className="card w-full max-w-xl p-8 text-center">
        <div className="mx-auto mb-5 h-3 w-28 animate-pulse rounded-full bg-[var(--color-primary-light)]" />
        <div className="mx-auto mb-3 h-8 w-64 animate-pulse rounded-full bg-[#efecff]" />
        <div className="mx-auto h-4 w-80 animate-pulse rounded-full bg-[#efecff]" />
      </div>
    </div>
  );
}
