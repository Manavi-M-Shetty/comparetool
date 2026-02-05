// frontend/src/pages/ReportPreviewPage.jsx
import React, { useState, useMemo } from 'react';
import { useComparison } from '../context/ComparisonContext';

// Change Type Badge Component
function ChangeTypeBadge({ file }) {
  let type = 'modified';
  let label = 'Modified';

  // Determine status based on backend data
  if (file.missing_side === 'OLD' || (file.summary && file.summary.includes('Missing in OLD'))) {
    type = 'added';
    label = 'New file (added)';
  } else if (file.missing_side === 'NEW' || (file.summary && file.summary.includes('Missing in NEW'))) {
    type = 'removed';
    label = 'Missing (removed)';
  }

  const configs = {
    modified: {
      className: 'bg-amber-50 text-amber-700 border-amber-200',
      icon: (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
          />
        </svg>
      ),
    },
    added: {
      className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: (
        <svg
          className="w-3 h-3"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 4v16m8-8H4"
          />
        </svg>
      ),
    },
    removed: {
      className: 'bg-red-50 text-red-700 border-red-200',
      icon: (
        <svg
          className="w-3 h-3"
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
      ),
    },
  };

  const config = configs[type];

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${config.className}`}
    >
      {config.icon}
      {label}
    </span>
  );
}

// Stats Card Component
function StatCard({ icon, label, value, color = 'purple' }) {
  const colors = {
    purple: 'border-purple-200 text-purple-800',
    amber: 'border-amber-200 text-amber-800',
    emerald: 'border-emerald-200 text-emerald-800',
    cyan: 'border-cyan-200 text-cyan-800',
  };

  const iconBg = {
    purple: 'bg-purple-50 text-purple-700',
    amber: 'bg-amber-50 text-amber-700',
    emerald: 'bg-emerald-50 text-emerald-700',
    cyan: 'bg-cyan-50 text-cyan-700',
  };

  return (
    <div className={`glass-panel px-4 py-3 flex items-center gap-3 border ${colors[color]}`}>
      <div className={`p-2 rounded-md ${iconBg[color]}`}>
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-slate-900">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-slate-500">
          {label}
        </div>
      </div>
    </div>
  );
}

export default function ReportPreviewPage() {
  const { folderResult, comments } = useComparison();
  const [searchTerm, setSearchTerm] = useState('');

  const changedFiles = useMemo(() => {
    return (folderResult?.file_summaries || []).filter((fs) => fs.has_changes);
  }, [folderResult]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return changedFiles;
    return changedFiles.filter(
      (fs) =>
        fs.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        fs.component_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [changedFiles, searchTerm]);

  const totalComments = useMemo(() => {
    return Object.values(comments).reduce(
      (acc, fileComments) => acc + Object.keys(fileComments).length,
      0
    );
  }, [comments]);

  return (
    <div className="min-h-full px-4 py-4 md:px-6 md:py-6 bg-slate-100">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <div className="glass-panel px-4 py-3 md:px-5 md:py-4 flex flex-col gap-1">
          <h1 className="text-lg md:text-xl font-semibold text-slate-900">
            Report preview
          </h1>
          <p className="text-sm text-slate-500">
            Overview of all changed files and their status.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatCard
            icon={
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
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            }
            label="Files changed"
            value={changedFiles.length}
            color="purple"
          />
          <StatCard
            icon={
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            }
            label="Modifications"
            value={
              changedFiles.filter(
                (f) => !f.summary?.includes('Missing')
              ).length
            }
            color="amber"
          />
          <StatCard
            icon={
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
                  d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                />
              </svg>
            }
            label="Total comments"
            value={totalComments}
            color="emerald"
          />
          <StatCard
            icon={
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
                  d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4"
                />
              </svg>
            }
            label="Components"
            value={folderResult?.total_components || 0}
            color="cyan"
          />
        </div>

        {/* Main content table */}
        <div className="glass-panel flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-slate-200">
            <div className="relative max-w-sm">
              <svg
                className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search files or components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-md border border-slate-300 bg-white text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              />
            </div>
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-[11px] uppercase tracking-wide text-slate-500">
                  <th className="px-6 py-3 font-medium w-1/3">Component</th>
                  <th className="px-6 py-3 font-medium w-1/3">File name</th>
                  <th className="px-6 py-3 font-medium text-right w-1/3">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file, idx) => (
                    <tr
                      key={idx}
                      className="hover:bg-purple-50/60 transition-colors"
                    >
                      <td className="px-6 py-3 text-sm text-purple-800 font-medium">
                        {file.component_name}
                      </td>
                      <td className="px-6 py-3 text-sm text-slate-700">
                        {file.file_name}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <ChangeTypeBadge file={file} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-6 py-10 text-center text-sm text-slate-500"
                    >
                      {searchTerm
                        ? 'No matching files found'
                        : 'No changes found'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}