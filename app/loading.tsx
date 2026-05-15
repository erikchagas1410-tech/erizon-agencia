export default function GlobalLoading() {
  return (
    <div className="flex min-h-screen items-center justify-center px-6">
      <div className="glass-panel neon-border w-full max-w-xl rounded-[2rem] p-8 text-center">
        <div className="mx-auto mb-5 h-3 w-28 animate-pulse rounded-full bg-white/20" />
        <div className="mx-auto mb-3 h-8 w-64 animate-pulse rounded-full bg-white/10" />
        <div className="mx-auto h-4 w-80 animate-pulse rounded-full bg-white/10" />
      </div>
    </div>
  );
}
