// frontend/src/components/CompareButton.jsx
/**
 * Compare and Update button component.
 * Primary action button that triggers folder comparison and optional Excel update.
 * Shows loading state with spinner during comparison process.
 */

export default function CompareButton({
  onClick,
  disabled = false,
  loading = false,
}) {
  const isDisabled = disabled || loading;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isDisabled}
      aria-busy={loading}
      className={`
        btn-primary
        min-w-[200px]
        px-8 py-3
        flex items-center justify-center gap-2
      `}
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
          <span className="text-sm font-medium">Comparing...</span>
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
          <span className="text-sm font-medium">Compare &amp; Update</span>
        </>
      )}
    </button>
  );
}