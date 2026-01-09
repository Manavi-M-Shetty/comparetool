export default function StatusBar({ status, message }) {
  return (
    <div className={`px-4 py-2 text-sm rounded ${
      status === 'success' ? 'bg-green-100 text-green-800' :
      status === 'error' ? 'bg-red-100 text-red-800' :
      status === 'warning' ? 'bg-yellow-100 text-yellow-800' :
      'bg-gray-100 text-gray-800'
    }`}>
      {message || 'Ready'}
    </div>
  )
}
