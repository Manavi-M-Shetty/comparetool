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
    label = 'New File (Added)';
  } else if (file.missing_side === 'NEW' || (file.summary && file.summary.includes('Missing in NEW'))) {
    type = 'removed';
    label = 'Missing (Removed)';
  }

  const configs = {
    modified: {
      className: 'bg-amber-500/10 text-amber-300 border-amber-500/20',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
        </svg>
      ),
    },
    added: {
      className: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/20',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
        </svg>
      ),
    },
    removed: {
      className: 'bg-red-500/10 text-red-300 border-red-500/20',
      icon: (
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      ),
    },
  };

  const config = configs[type];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-md border ${config.className}`}>
      {config.icon}
      {label}
    </span>
  );
}

// Stats Card Component
function StatCard({ icon, label, value, color = 'purple' }) {
  const colors = {
    purple: 'from-purple-500/20 to-pink-500/20 border-purple-500/20 text-purple-300',
    amber: 'from-amber-500/20 to-orange-500/20 border-amber-500/20 text-amber-300',
    emerald: 'from-emerald-500/20 to-green-500/20 border-emerald-500/20 text-emerald-300',
    cyan: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/20 text-cyan-300',
  };

  return (
    <div className={`flex items-center gap-3 px-4 py-3 rounded-xl bg-gradient-to-r ${colors[color]} border backdrop-blur-sm`}>
      <div className="p-2 rounded-lg bg-white/10">
        {icon}
      </div>
      <div>
        <div className="text-xl font-bold text-white">{value}</div>
        <div className="text-[10px] uppercase tracking-wider text-white/60">{label}</div>
      </div>
    </div>
  );
}

export default function ReportPreviewPage() {
  const { folderResult, comments } = useComparison();
  const [searchTerm, setSearchTerm] = useState('');

  const changedFiles = useMemo(() => {
    return (folderResult?.file_summaries || []).filter(fs => fs.has_changes);
  }, [folderResult]);

  const filteredFiles = useMemo(() => {
    if (!searchTerm) return changedFiles;
    return changedFiles.filter(fs => 
      fs.file_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      fs.component_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [changedFiles, searchTerm]);

  const totalComments = useMemo(() => {
    return Object.values(comments).reduce((acc, fileComments) => 
      acc + Object.keys(fileComments).length, 0
    );
  }, [comments]);

  return (
    <div className="min-h-full relative">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-pink-600/10 rounded-full blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white mb-1">
              Report Preview
            </h1>
            <p className="text-sm text-gray-400">
              Overview of all changed files.
            </p>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>}
            label="Files Changed"
            value={changedFiles.length}
            color="purple"
          />
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" /></svg>}
            label="Modifications"
            value={changedFiles.filter(f => !f.summary?.includes('Missing')).length}
            color="amber"
          />
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" /></svg>}
            label="Total Comments"
            value={totalComments}
            color="emerald"
          />
          <StatCard
            icon={<svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4" /></svg>}
            label="Components"
            value={folderResult?.total_components || 0}
            color="cyan"
          />
        </div>

        {/* Main content table */}
        <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Toolbar */}
          <div className="p-4 bg-black/20 border-b border-white/5">
            <div className="relative max-w-sm">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                type="text"
                placeholder="Search files or components..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-black/30 border border-white/10 rounded-lg text-sm text-white placeholder-gray-500 focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/20 transition-all"
              />
            </div>
          </div>

          {/* Simple Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-xs uppercase tracking-wider text-gray-400">
                  <th className="px-6 py-4 font-semibold w-1/3">Component</th>
                  <th className="px-6 py-4 font-semibold w-1/3">File Name</th>
                  <th className="px-6 py-4 font-semibold text-right w-1/3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredFiles.length > 0 ? (
                  filteredFiles.map((file, idx) => (
                    <tr key={idx} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 text-sm text-purple-300 font-medium">
                        {file.component_name}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-200">
                        {file.file_name}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <ChangeTypeBadge file={file} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="3" className="px-6 py-12 text-center text-gray-500 text-sm">
                      {searchTerm ? 'No matching files found' : 'No changes found'}
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