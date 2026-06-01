import Icon from './Icon';

/**
 * Friendly, reusable error view for failed data fetches.
 *
 * Distinguishes between three common failure modes so the user gets an
 * actionable message instead of a blank screen:
 *   • offline / network / CORS    → "check your connection"
 *   • 5xx server errors           → "something went wrong on our end"
 *   • everything else             → the server's message (or a generic one)
 */

/** Best-effort, human-friendly message from an axios/fetch error. */
export function errorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error) return fallback;
  const status = error.response?.status;
  const serverMsg = error.response?.data?.message;

  // No response at all → network / CORS / offline
  if (error.response === undefined) {
    if (typeof navigator !== 'undefined' && navigator.onLine === false) {
      return 'You appear to be offline. Check your internet connection and try again.';
    }
    return "We couldn't reach the server. Please check your connection and try again.";
  }
  if (status === 401) return 'Your session has expired. Please log in again.';
  if (status === 403) return "You don't have permission to view this.";
  if (status === 404) return 'We couldn’t find what you were looking for.';
  if (status >= 500) return 'Something went wrong on our end. Please try again in a moment.';

  if (Array.isArray(serverMsg)) return serverMsg[0] || fallback;
  return serverMsg || fallback;
}

export default function ErrorState({
  error,
  title = 'Unable to load',
  description,
  onRetry,
  retrying = false,
  className = '',
  compact = false,
}) {
  const isOffline =
    error?.response === undefined &&
    typeof navigator !== 'undefined' &&
    navigator.onLine === false;
  const message = description || errorMessage(error);

  return (
    <div
      className={`text-center ${compact ? 'py-10' : 'py-16'} px-6 animate-fade-up ${className}`.trim()}
      role="alert"
    >
      <div className="mx-auto w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-600 dark:text-red-400 mb-5">
        <Icon name={isOffline ? 'wifi' : 'alert'} className="w-8 h-8" />
      </div>
      <h3 className="text-lg font-semibold text-fg">{title}</h3>
      <p className="text-sm text-muted mt-1.5 max-w-sm mx-auto">{message}</p>
      {onRetry && (
        <div className="mt-6 flex justify-center">
          <button onClick={onRetry} disabled={retrying} className="btn-secondary text-sm">
            {retrying ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-current/30 border-t-current animate-spin" />
                Retrying…
              </>
            ) : (
              <>
                <Icon name="refresh" className="w-4 h-4" /> Try again
              </>
            )}
          </button>
        </div>
      )}
    </div>
  );
}
