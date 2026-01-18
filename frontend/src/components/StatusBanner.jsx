// frontend/src/components/StatusBanner.jsx
import React from 'react';
import { useComparison } from '../context/ComparisonContext';

export default function StatusBanner() {
  const { status } = useComparison();

  if (!status || !status.message) return null;

  const type = status.type || 'info';

  let classes = 'border-b';
  if (type === 'error') {
    classes += ' bg-red-50 border-red-200 text-red-700';
  } else if (type === 'success') {
    classes += ' bg-emerald-50 border-emerald-200 text-emerald-700';
  } else {
    classes += ' bg-sky-50 border-sky-200 text-sky-700';
  }

  return (
    <div className={classes}>
      <div className="max-w-7xl mx-auto px-4 py-2 text-sm">
        {status.message}
      </div>
    </div>
  );
}