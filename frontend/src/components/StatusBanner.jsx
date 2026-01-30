// frontend/src/components/StatusBanner.jsx
import React, { useEffect, useState } from 'react';
import { useComparison } from '../context/ComparisonContext';

// Icon components for each status type
const StatusIcons = {
  error: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  success: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  info: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  ),
  warning: (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
    </svg>
  ),
};

// Status configuration
const statusConfig = {
  error: {
    bg: 'from-red-950/90 via-red-900/80 to-red-950/90',
    border: 'border-red-500/30',
    iconBg: 'bg-red-500/20',
    iconColor: 'text-red-400',
    textColor: 'text-red-100',
    accentColor: 'bg-red-500',
    glowColor: 'shadow-red-500/20',
  },
  success: {
    bg: 'from-emerald-950/90 via-emerald-900/80 to-emerald-950/90',
    border: 'border-emerald-500/30',
    iconBg: 'bg-emerald-500/20',
    iconColor: 'text-emerald-400',
    textColor: 'text-emerald-100',
    accentColor: 'bg-emerald-500',
    glowColor: 'shadow-emerald-500/20',
  },
  info: {
    bg: 'from-blue-950/90 via-blue-900/80 to-blue-950/90',
    border: 'border-blue-500/30',
    iconBg: 'bg-blue-500/20',
    iconColor: 'text-blue-400',
    textColor: 'text-blue-100',
    accentColor: 'bg-blue-500',
    glowColor: 'shadow-blue-500/20',
  },
  warning: {
    bg: 'from-amber-950/90 via-amber-900/80 to-amber-950/90',
    border: 'border-amber-500/30',
    iconBg: 'bg-amber-500/20',
    iconColor: 'text-amber-400',
    textColor: 'text-amber-100',
    accentColor: 'bg-amber-500',
    glowColor: 'shadow-amber-500/20',
  },
  loading: {
    bg: 'from-purple-950/90 via-purple-900/80 to-purple-950/90',
    border: 'border-purple-500/30',
    iconBg: 'bg-purple-500/20',
    iconColor: 'text-purple-400',
    textColor: 'text-purple-100',
    accentColor: 'bg-purple-500',
    glowColor: 'shadow-purple-500/20',
  },
};

export default function StatusBanner() {
  const { status, setStatus } = useComparison();
  const [isVisible, setIsVisible] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

  useEffect(() => {
    if (status && status.message) {
      setIsVisible(true);
      setIsLeaving(false);

      // Auto-dismiss success and info messages after 5 seconds
      if (status.type === 'success' || status.type === 'info') {
        const timer = setTimeout(() => {
          handleDismiss();
        }, 5000);
        return () => clearTimeout(timer);
      }
    } else {
      setIsVisible(false);
    }
  }, [status]);

  const handleDismiss = () => {
    setIsLeaving(true);
    setTimeout(() => {
      setStatus(null);
      setIsVisible(false);
      setIsLeaving(false);
    }, 300);
  };

  if (!status || !status.message || !isVisible) return null;

  const type = status.type || 'info';
  const config = statusConfig[type] || statusConfig.info;

  return (
    <div
      className={`
        relative overflow-hidden z-50
        transition-all duration-300 ease-out
        ${isLeaving ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      {/* Background gradient */}
      <div className={`absolute inset-0 bg-gradient-to-r ${config.bg} backdrop-blur-xl`} />
      
      {/* Top accent line */}
      <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-current to-transparent ${config.iconColor} opacity-50`} />
      
      {/* Bottom border */}
      <div className={`absolute bottom-0 left-0 right-0 h-px ${config.border.replace('border-', 'bg-')}`} />

      {/* Animated glow effect */}
      <div 
        className={`absolute inset-0 opacity-30 ${config.glowColor}`}
        style={{
          background: `radial-gradient(circle at 20% 50%, currentColor 0%, transparent 50%)`,
          animation: 'pulse 2s ease-in-out infinite',
        }}
      />

      {/* Content */}
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left section: Icon + Message */}
          <div className="flex items-center gap-3 min-w-0">
            {/* Icon container */}
            <div className={`
              flex-shrink-0 p-2 rounded-lg 
              ${config.iconBg} ${config.iconColor}
              ring-1 ring-white/10
              shadow-lg ${config.glowColor}
            `}>
              {StatusIcons[type]}
            </div>

            {/* Message */}
            <div className="min-w-0">
              <p className={`text-sm font-medium ${config.textColor} truncate`}>
                {status.message}
              </p>
              {status.details && (
                <p className={`text-xs ${config.textColor} opacity-70 truncate mt-0.5`}>
                  {status.details}
                </p>
              )}
            </div>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Progress indicator for loading */}
            {type === 'loading' && (
              <div className="hidden sm:flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${config.iconColor.replace('text-', 'bg-')} animate-bounce`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Timestamp */}
            <span className={`hidden sm:block text-xs ${config.textColor} opacity-50 font-mono`}>
              {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* Dismiss button */}
            {type !== 'loading' && (
              <button
                onClick={handleDismiss}
                className={`
                  p-1.5 rounded-lg transition-all duration-200
                  hover:bg-white/10 active:bg-white/20
                  ${config.iconColor} hover:text-white
                  focus:outline-none focus:ring-2 focus:ring-white/20
                `}
                aria-label="Dismiss notification"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar for auto-dismiss */}
        {(type === 'success' || type === 'info') && (
          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white/10">
            <div 
              className={`h-full ${config.accentColor} opacity-50`}
              style={{
                animation: 'shrink 5s linear forwards',
              }}
            />
          </div>
        )}
      </div>

      {/* Keyframe animation */}
      <style jsx>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}