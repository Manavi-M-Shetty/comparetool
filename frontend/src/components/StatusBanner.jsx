/**
 * Status banner component for displaying application messages.
 *
 * Features:
 * - Auto-dismissing notifications
 * - Multiple status types (success, error, info, warning)
 * - Customizable timeout and styling
 * - Status icon and message display
 */

import React, { useEffect, useState } from 'react';
import { useComparison } from '../context/ComparisonContext';

// Icon components for each status type
const StatusIcons = {
  error: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  success: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  info: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  warning: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
  ),
  loading: (
    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
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
  ),
};

// Flat status configuration (light + dark)
const statusConfig = {
  error: {
    bg: 'bg-red-50 dark:bg-red-900/40',
    border: 'border-red-200 dark:border-red-500/40',
    iconBg: 'bg-red-100 dark:bg-red-900/60',
    iconColor: 'text-red-600 dark:text-red-100',
    textColor: 'text-red-900 dark:text-red-50',
    accentColor: 'bg-red-500',
  },
  success: {
    bg: 'bg-emerald-50 dark:bg-emerald-900/40',
    border: 'border-emerald-200 dark:border-emerald-500/40',
    iconBg: 'bg-emerald-100 dark:bg-emerald-900/60',
    iconColor: 'text-emerald-600 dark:text-emerald-100',
    textColor: 'text-emerald-900 dark:text-emerald-50',
    accentColor: 'bg-emerald-500',
  },
  info: {
    bg: 'bg-blue-50 dark:bg-blue-900/40',
    border: 'border-blue-200 dark:border-blue-500/40',
    iconBg: 'bg-blue-100 dark:bg-blue-900/60',
    iconColor: 'text-blue-600 dark:text-blue-100',
    textColor: 'text-blue-900 dark:text-blue-50',
    accentColor: 'bg-blue-500',
  },
  warning: {
    bg: 'bg-amber-50 dark:bg-amber-900/40',
    border: 'border-amber-200 dark:border-amber-500/40',
    iconBg: 'bg-amber-100 dark:bg-amber-900/60',
    iconColor: 'text-amber-600 dark:text-amber-100',
    textColor: 'text-amber-900 dark:text-amber-50',
    accentColor: 'bg-amber-500',
  },
  loading: {
    bg: 'bg-purple-50 dark:bg-purple-900/40',
    border: 'border-purple-200 dark:border-purple-500/40',
    iconBg: 'bg-purple-100 dark:bg-purple-900/60',
    iconColor: 'text-purple-600 dark:text-purple-100',
    textColor: 'text-purple-900 dark:text-purple-50',
    accentColor: 'bg-purple-500',
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
        relative z-50 border-b ${config.border} ${config.bg}
        transition-all duration-300 ease-out
        ${isLeaving ? 'opacity-0 -translate-y-full' : 'opacity-100 translate-y-0'}
      `}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-4">
          {/* Left section: Icon + Message */}
          <div className="flex items-start gap-3 min-w-0 w-full sm:w-auto">
            <div
              className={`
                flex-shrink-0 p-1.5 rounded-md
                ${config.iconBg} ${config.iconColor}
              `}
            >
              {StatusIcons[type]}
            </div>

            <div className="min-w-0">
              <p
                className={`text-sm font-medium ${config.textColor} whitespace-normal break-words sm:truncate`}
              >
                {status.message}
              </p>
              {status.details && (
                <p
                  className={`text-xs ${config.textColor} opacity-70 whitespace-normal break-words sm:truncate mt-0.5`}
                >
                  {status.details}
                </p>
              )}
            </div>
          </div>

          {/* Right section: Actions */}
          <div className="flex items-center gap-2 flex-shrink-0 w-full sm:w-auto justify-between sm:justify-end">
            {/* Progress indicator for loading */}
            {type === 'loading' && (
              <div className="hidden sm:flex items-center gap-1.5">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className={`w-1.5 h-1.5 rounded-full ${
                      config.iconColor.split(' ')[0].replace('text-', 'bg-')
                    } animate-bounce`}
                    style={{ animationDelay: `${i * 150}ms` }}
                  />
                ))}
              </div>
            )}

            {/* Timestamp */}
            <span
              className={`hidden sm:block text-xs ${config.textColor} opacity-60 font-mono`}
            >
              {new Date().toLocaleTimeString([], {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>

            {/* Dismiss button */}
            {type !== 'loading' && (
              <button
                onClick={handleDismiss}
                className={`
                  p-1.5 rounded-md transition-colors
                  hover:bg-white/40
                  text-slate-600 hover:text-slate-900
                  focus:outline-none focus:ring-2 focus:ring-slate-300
                  dark:text-slate-300 dark:hover:text-slate-100 dark:hover:bg-slate-700/70 dark:focus:ring-slate-600
                `}
                aria-label="Dismiss notification"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Progress bar for auto-dismiss (success/info only) */}
        {(type === 'success' || type === 'info') && (
          <div className="relative mt-2 h-0.5 bg-white/40 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className={`h-full ${config.accentColor}`}
              style={{
                animation: 'shrink 5s linear forwards',
              }}
            />
          </div>
        )}
      </div>

      {/* Keyframe animation for auto-dismiss bar */}
      <style>{`
        @keyframes shrink {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </div>
  );
}