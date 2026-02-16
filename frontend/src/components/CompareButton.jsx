/**
 * Compare and Update button component.
 * Primary action button that triggers folder comparison
 * Shows loading state with spinner during comparison process.
 */

export default function CompareButton({
  onClick,
  disabled = false,
  loading = false,
}) {
  const isDisabled = disabled || loading;

  const baseClasses = `
    inline-flex items-center justify-center gap-2
    rounded-md px-5 sm:px-8 py-2.5 sm:py-3
    min-w-[160px] sm:min-w-[200px]
    text-xs sm:text-sm font-medium
    bg-purple-600 text-white border border-purple-600 shadow-sm
    hover:bg-purple-700 hover:border-purple-700
    focus:outline-none focus:ring-2 focus:ring-purple-500/60 focus:ring-offset-1 focus:ring-offset-transparent
    disabled:opacity-60 disabled:cursor-not-allowed
    dark:bg-purple-500 dark:border-purple-500
    dark:hover:bg-purple-400 dark:hover:border-purple-400
    dark:focus:ring-purple-400/70
  `;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={baseClasses}
    >
      {loading ? (
        <>
          <svg
            className="w-4 h-4 animate-spin text-white"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span className="text-sm font-medium">Comparing…</span>
        </>
      ) : (
        <>
          <svg
            className="w-5 h-5 text-white"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
            />
          </svg>
          <span className="text-sm font-medium">Compare</span>
        </>
      )}
    </button>
  );
}