// frontend/src/components/CompareButton.jsx
export default function CompareButton({ onClick, disabled = false, loading = false }) {
  return (
    <div className="relative group">
      {/* Glow effect behind button */}
      <div 
        className={`
          absolute -inset-1 rounded-2xl blur-lg transition-all duration-500
          ${disabled || loading 
            ? 'opacity-0' 
            : 'bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 opacity-50 group-hover:opacity-75 group-hover:blur-xl'
          }
        `}
        style={{
          backgroundSize: '200% 200%',
          animation: !disabled && !loading ? 'gradient-shift 3s ease infinite' : 'none'
        }}
      />
      
      {/* Main button */}
      <button
        onClick={onClick}
        disabled={disabled || loading}
        className={`
          relative flex items-center justify-center gap-3
          px-8 py-4 min-w-[200px]
          rounded-xl font-semibold text-sm
          transition-all duration-300 transform
          border backdrop-blur-sm
          ${disabled || loading
            ? 'bg-gray-800/80 text-gray-500 cursor-not-allowed border-gray-700/50'
            : `
                bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600
                hover:from-purple-500 hover:via-pink-500 hover:to-purple-500
                text-white border-purple-400/20
                shadow-[0_0_20px_rgba(168,85,247,0.3)]
                hover:shadow-[0_0_30px_rgba(168,85,247,0.5)]
                hover:-translate-y-1 hover:scale-[1.02]
                active:translate-y-0 active:scale-100
              `
          }
        `}
        style={{
          backgroundSize: '200% 200%',
          animation: !disabled && !loading ? 'gradient-shift 3s ease infinite' : 'none'
        }}
      >
        {loading ? (
          <>
            {/* Enhanced loading spinner */}
            <div className="relative w-5 h-5">
              {/* Outer ring */}
              <svg 
                className="absolute inset-0 animate-spin" 
                viewBox="0 0 24 24" 
                fill="none"
              >
                <circle 
                  className="opacity-20" 
                  cx="12" 
                  cy="12" 
                  r="10" 
                  stroke="currentColor" 
                  strokeWidth="3"
                />
                <path 
                  className="opacity-90" 
                  fill="currentColor" 
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              {/* Inner pulse */}
              <div className="absolute inset-2 bg-white/30 rounded-full animate-pulse" />
            </div>
            <span className="tracking-wide">Comparing...</span>
            {/* Animated dots */}
            <span className="flex gap-0.5">
              <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
              <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
              <span className="w-1 h-1 bg-white/70 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
          </>
        ) : disabled ? (
          <>
            {/* Disabled state */}
            <svg className="w-5 h-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
            <span className="tracking-wide">Compare & Update</span>
          </>
        ) : (
          <>
            {/* Default state with animated icon */}
            <div className="relative">
              {/* Sparkle effects */}
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-yellow-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" />
              <div className="absolute -bottom-1 -left-1 w-1.5 h-1.5 bg-pink-300 rounded-full opacity-0 group-hover:opacity-100 group-hover:animate-ping" style={{ animationDelay: '200ms' }} />
              
              {/* Main icon */}
              <svg 
                className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor" 
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            
            <span className="tracking-wide">Compare & Update</span>
            
            {/* Arrow icon with animation */}
            <svg 
              className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" 
              fill="none" 
              viewBox="0 0 24 24" 
              stroke="currentColor" 
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </>
        )}
        
        {/* Shimmer effect overlay */}
        {!disabled && !loading && (
          <div 
            className="absolute inset-0 rounded-xl overflow-hidden"
            style={{ pointerEvents: 'none' }}
          >
            <div 
              className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out"
              style={{
                background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
              }}
            />
          </div>
        )}
      </button>
      
      {/* Keyboard hint */}
      {!disabled && !loading && (
        <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <span className="text-[10px] text-gray-500 flex items-center gap-1">
            Press
            <kbd className="px-1.5 py-0.5 bg-gray-800 rounded text-gray-400 font-mono text-[9px] border border-gray-700">
              Enter
            </kbd>
          </span>
        </div>
      )}
      
      {/* CSS for gradient animation */}
      <style jsx>{`
        @keyframes gradient-shift {
          0%, 100% {
            background-position: 0% 50%;
          }
          50% {
            background-position: 100% 50%;
          }
        }
      `}</style>
    </div>
  );
}