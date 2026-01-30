// frontend/src/components/ProcessingOverlay.jsx
import React, { useEffect, useState } from 'react';

export default function ProcessingOverlay({ isVisible, currentFile, progress, total, current }) {
  const [displayProgress, setDisplayProgress] = useState(0);
  const [particles, setParticles] = useState([]);

  // Smooth progress animation
  useEffect(() => {
    const timer = setTimeout(() => {
      setDisplayProgress(progress);
    }, 100);
    return () => clearTimeout(timer);
  }, [progress]);

  // Generate floating particles
  useEffect(() => {
    if (isVisible) {
      const newParticles = Array.from({ length: 20 }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        y: Math.random() * 100,
        size: Math.random() * 4 + 2,
        duration: Math.random() * 3 + 2,
        delay: Math.random() * 2,
      }));
      setParticles(newParticles);
    }
  }, [isVisible]);

  if (!isVisible) return null;

  const isComplete = progress >= 100;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />

      {/* Animated gradient background */}
      <div className="absolute inset-0 opacity-30">
        <div 
          className="absolute inset-0"
          style={{
            background: `
              radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 80% 50%, rgba(236, 72, 153, 0.3) 0%, transparent 50%),
              radial-gradient(circle at 50% 80%, rgba(6, 182, 212, 0.3) 0%, transparent 50%)
            `,
            animation: 'pulse 4s ease-in-out infinite',
          }}
        />
      </div>

      {/* Grid pattern */}
      <div 
        className="absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(139, 92, 246, 0.5) 1px, transparent 1px),
            linear-gradient(90deg, rgba(139, 92, 246, 0.5) 1px, transparent 1px)
          `,
          backgroundSize: '50px 50px',
        }}
      />

      {/* Floating particles */}
      {particles.map((particle) => (
        <div
          key={particle.id}
          className="absolute rounded-full bg-purple-500/30 blur-sm"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            width: `${particle.size}px`,
            height: `${particle.size}px`,
            animation: `float ${particle.duration}s ease-in-out ${particle.delay}s infinite`,
          }}
        />
      ))}

      {/* Main content container */}
      <div className="relative z-10 flex flex-col items-center w-full max-w-lg px-8">
        
        {/* Animated scanner visualization */}
        <div className="relative w-40 h-40 mb-10">
          {/* Outer glow */}
          <div className={`absolute inset-0 rounded-full blur-2xl transition-colors duration-500 ${
            isComplete ? 'bg-emerald-500/30' : 'bg-purple-500/30'
          }`} />

          {/* Concentric rings */}
          <div className="absolute inset-0">
            {[0, 1, 2].map((ring) => (
              <div
                key={ring}
                className={`absolute rounded-full border transition-colors duration-500 ${
                  isComplete ? 'border-emerald-500/30' : 'border-purple-500/30'
                }`}
                style={{
                  inset: `${ring * 12}px`,
                  animation: `ping ${2 + ring * 0.5}s cubic-bezier(0, 0, 0.2, 1) infinite`,
                  animationDelay: `${ring * 0.3}s`,
                }}
              />
            ))}
          </div>

          {/* Spinning outer ring */}
          <div className="absolute inset-0">
            <svg className="w-full h-full animate-spin" style={{ animationDuration: '3s' }} viewBox="0 0 100 100">
              <defs>
                <linearGradient id="spinGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor={isComplete ? '#10b981' : '#a855f7'} />
                  <stop offset="50%" stopColor={isComplete ? '#34d399' : '#ec4899'} />
                  <stop offset="100%" stopColor={isComplete ? '#10b981' : '#06b6d4'} />
                </linearGradient>
              </defs>
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke="url(#spinGradient)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="70 200"
              />
            </svg>
          </div>

          {/* Counter-rotating inner ring */}
          <div className="absolute inset-4">
            <svg 
              className="w-full h-full" 
              style={{ animation: 'spin 4s linear infinite reverse' }} 
              viewBox="0 0 100 100"
            >
              <circle
                cx="50"
                cy="50"
                r="45"
                fill="none"
                stroke={isComplete ? 'rgba(16, 185, 129, 0.3)' : 'rgba(168, 85, 247, 0.3)'}
                strokeWidth="1"
                strokeDasharray="10 20"
              />
            </svg>
          </div>

          {/* Center icon */}
          <div className={`absolute inset-8 rounded-full flex items-center justify-center transition-all duration-500 ${
            isComplete 
              ? 'bg-gradient-to-br from-emerald-500/20 to-green-600/20 border border-emerald-500/30' 
              : 'bg-gradient-to-br from-purple-500/20 to-pink-600/20 border border-purple-500/30'
          }`}>
            {isComplete ? (
              <svg className="w-10 h-10 text-emerald-400 animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="w-10 h-10 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            )}
          </div>

          {/* Progress ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke="rgba(255,255,255,0.1)"
              strokeWidth="2"
            />
            <circle
              cx="50"
              cy="50"
              r="48"
              fill="none"
              stroke={isComplete ? '#10b981' : 'url(#progressGradient)'}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={`${displayProgress * 3.02} 302`}
              className="transition-all duration-500 ease-out"
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#a855f7" />
                <stop offset="50%" stopColor="#ec4899" />
                <stop offset="100%" stopColor="#06b6d4" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* Status text */}
        <div className="text-center mb-8">
          <h2 className={`text-2xl font-bold tracking-wider uppercase mb-2 transition-colors duration-500 ${
            isComplete 
              ? 'bg-gradient-to-r from-emerald-300 to-green-300 bg-clip-text text-transparent' 
              : 'bg-gradient-to-r from-purple-300 via-pink-300 to-cyan-300 bg-clip-text text-transparent'
          }`}>
            {isComplete ? 'Capture Complete' : 'Capturing Screenshots'}
          </h2>
          
          <div className="h-8 flex items-center justify-center">
            {isComplete ? (
              <p className="text-emerald-400 text-sm font-medium flex items-center gap-2">
                <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                All screenshots saved to Excel
              </p>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-1.5 h-1.5 bg-cyan-400 rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }}
                    />
                  ))}
                </div>
                <p className="text-cyan-400 text-sm font-mono truncate max-w-xs">
                  {currentFile || 'Initializing...'}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="w-full space-y-3">
          {/* Bar container */}
          <div className="relative h-3 bg-slate-800/80 rounded-full overflow-hidden border border-white/5 shadow-lg shadow-purple-500/10">
            {/* Animated stripes background */}
            <div 
              className="absolute inset-0 opacity-20"
              style={{
                backgroundImage: 'linear-gradient(45deg, rgba(255,255,255,0.1) 25%, transparent 25%, transparent 50%, rgba(255,255,255,0.1) 50%, rgba(255,255,255,0.1) 75%, transparent 75%, transparent)',
                backgroundSize: '20px 20px',
                animation: 'moveStripes 1s linear infinite',
              }}
            />
            
            {/* Progress fill */}
            <div
              className={`absolute inset-y-0 left-0 rounded-full transition-all duration-500 ease-out ${
                isComplete 
                  ? 'bg-gradient-to-r from-emerald-500 to-green-400' 
                  : 'bg-gradient-to-r from-purple-600 via-pink-500 to-cyan-400'
              }`}
              style={{ width: `${displayProgress}%` }}
            >
              {/* Shimmer effect */}
              <div 
                className="absolute inset-0 rounded-full"
                style={{
                  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                  animation: 'shimmer 2s infinite',
                }}
              />
            </div>

            {/* Glow on progress tip */}
            {!isComplete && displayProgress > 0 && (
              <div
                className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full blur-sm opacity-50"
                style={{ left: `calc(${displayProgress}% - 8px)` }}
              />
            )}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {/* File counter */}
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                <svg className="w-4 h-4 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sm font-mono text-gray-300">
                  <span className={isComplete ? 'text-emerald-400' : 'text-white'}>{current}</span>
                  <span className="text-gray-600 mx-1">/</span>
                  <span className="text-gray-400">{total}</span>
                </span>
              </div>

              {/* Status badge */}
              <div className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                isComplete 
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' 
                  : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
              }`}>
                {isComplete ? 'Done' : 'Processing'}
              </div>
            </div>

            {/* Percentage */}
            <div className={`text-2xl font-bold font-mono transition-colors duration-500 ${
              isComplete ? 'text-emerald-400' : 'text-white'
            }`}>
              {Math.round(displayProgress)}%
            </div>
          </div>
        </div>

        {/* Keyboard hint */}
        {!isComplete && (
          <p className="mt-6 text-xs text-gray-600 flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Please wait while screenshots are being captured...
          </p>
        )}
      </div>

      {/* Keyframe animations */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) rotate(0deg); opacity: 0.3; }
          50% { transform: translateY(-20px) rotate(180deg); opacity: 0.6; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        @keyframes moveStripes {
          0% { background-position: 0 0; }
          100% { background-position: 20px 0; }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.5); opacity: 0; }
        }
      `}</style>
    </div>
  );
}