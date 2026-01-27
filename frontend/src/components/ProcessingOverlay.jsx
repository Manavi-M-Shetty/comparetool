// frontend/src/components/ProcessingOverlay.jsx
import React, { useEffect, useState } from 'react';

export default function ProcessingOverlay({ isVisible, currentFile, progress, total, current }) {
  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
      
      {/* Background Grid Effect */}
      <div className="absolute inset-0 opacity-10 pointer-events-none" 
           style={{ backgroundImage: 'linear-gradient(#4c1d95 1px, transparent 1px), linear-gradient(90deg, #4c1d95 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      <div className="relative flex flex-col items-center w-full max-w-md p-8">
        
        {/* Animated Scanner Circle */}
        <div className="relative w-32 h-32 mb-8 flex items-center justify-center">
          {/* Outer Ring */}
          <div className="absolute inset-0 border-4 border-purple-900/50 rounded-full"></div>
          {/* Spinning Ring */}
          <div className="absolute inset-0 border-t-4 border-l-4 border-cyan-400 rounded-full animate-spin"></div>
          {/* Inner Pulsing Circle */}
          <div className="absolute inset-4 bg-purple-600/20 rounded-full animate-pulse border border-purple-500/50 backdrop-blur-md flex items-center justify-center">
             <span className="text-2xl">📸</span>
          </div>
        </div>

        {/* Text Info */}
        <h2 className="text-2xl font-bold text-white mb-2 tracking-widest uppercase">
          {progress === 100 ? 'Sequence Complete' : 'System Capturing'}
        </h2>
        
        <div className="h-6 flex items-center justify-center mb-6 w-full">
            {progress < 100 ? (
                <p className="text-cyan-400 font-mono text-sm animate-pulse truncate max-w-xs">
                  Scanning: {currentFile || 'Initializing...'}
                </p>
            ) : (
                <p className="text-emerald-400 font-mono text-sm font-bold">
                  All screenshots saved to Excel.
                </p>
            )}
        </div>

        {/* Progress Bar Container */}
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden border border-gray-700 relative shadow-[0_0_15px_rgba(34,211,238,0.2)]">
          {/* Striped Background */}
          <div className="absolute inset-0 opacity-20" 
               style={{ backgroundImage: 'linear-gradient(45deg,rgba(255,255,255,.15) 25%,transparent 25%,transparent 50%,rgba(255,255,255,.15) 50%,rgba(255,255,255,.15) 75%,transparent 75%,transparent)', backgroundSize: '1rem 1rem' }}>
          </div>
          
          {/* Progress Fill */}
          <div 
            className="h-full bg-gradient-to-r from-purple-600 via-blue-500 to-cyan-400 transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>

        {/* Stats */}
        <div className="flex justify-between w-full mt-2 text-xs font-mono text-gray-500">
          <span>{current} / {total}</span>
          <span>{Math.round(progress)}%</span>
        </div>

      </div>
    </div>
  );
}