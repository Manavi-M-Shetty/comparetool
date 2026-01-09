export default function CompareButton({ onClick, disabled = false, loading = false }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
        disabled || loading
          ? 'bg-gray-400 text-gray-200 cursor-not-allowed'
          : 'bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800'
      }`}
    >
      {loading ? 'Comparing...' : 'Compare and Update'}
    </button>
  )
}
