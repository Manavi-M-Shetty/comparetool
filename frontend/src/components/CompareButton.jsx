// frontend/src/components/CompareButton.jsx
export default function CompareButton({ onClick, disabled = false, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-6 py-3 rounded-lg font-semibold text-sm transition-all duration-300 transform shadow-lg flex items-center justify-center min-w-[160px] ${
        disabled || loading
          ? 'bg-gray-700 text-gray-400 cursor-not-allowed shadow-none border border-gray-600'
          : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-900/40 hover:-translate-y-0.5 hover:shadow-purple-700/50'
      }`}
    >
      {loading ? (
        <>
          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          Comparing...
        </>
      ) : (
        'Compare & Update'
      )}
    </button>
  )
}