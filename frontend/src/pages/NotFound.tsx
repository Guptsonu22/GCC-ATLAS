import { Link } from 'react-router-dom';
import { Compass } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="flex min-h-[50vh] flex-col items-center justify-center gap-4 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-md border border-teal-accent/30 bg-teal-accent/10">
        <Compass className="h-5 w-5 text-teal-accent" />
      </span>
      <div>
        <h1 className="text-lg font-semibold text-ink-100">Page not found</h1>
        <p className="mt-1 text-sm text-ink-400">The page you are looking for does not exist in GCC Atlas.</p>
      </div>
      <Link
        to="/"
        className="rounded bg-teal-accent px-4 py-2 text-sm font-semibold text-surface-950 hover:opacity-90"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
