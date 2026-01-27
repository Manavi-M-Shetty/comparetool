// frontend/src/pages/ReportPreviewPage.jsx
import React from 'react'
import { useComparison } from '../context/ComparisonContext'

export default function ReportPreviewPage(){
  const { folderResult, comments } = useComparison();

  return (
    <div className="max-w-5xl mx-auto p-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl p-6">
        <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-200 to-pink-200 mb-2">
          Excel Report Preview
        </h3>
        <div className="text-sm text-gray-400 mb-6 border-b border-white/5 pb-4">
          This preview lists changed keys and comments that will be included in the Excel report.
        </div>

        <div className="space-y-4">
          { (folderResult?.file_summaries || []).filter(fs => fs.has_changes).map((fs, idx) => (
            <div key={idx} className="p-4 border border-white/10 rounded-xl bg-black/20 hover:bg-black/30 transition-colors">
              <div className="flex items-center justify-between mb-2">
                <div className="font-semibold text-purple-300 text-sm">
                  {fs.component_name} <span className="text-gray-500 mx-2">/</span> {fs.file_name}
                </div>
                <div className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded bg-white/5 text-gray-400 border border-white/5">
                  {fs.summary}
                </div>
              </div>
              
              {/* List semantic changes and comments if any */}
              <div className="space-y-2 mt-3 pl-2 border-l-2 border-purple-500/20">
              { fs.semantic_diff?.changes?.map((ch, i) => (
                <div key={i} className="text-sm grid grid-cols-1 md:grid-cols-2 gap-2 p-2 rounded hover:bg-white/5 transition-colors">
                  <div className="col-span-2 text-xs font-mono text-cyan-200/80 mb-1">
                    Key: {ch.key || (ch.old_key + ' → ' + ch.new_key)}
                  </div>
                  <div className="text-xs text-red-300/80 bg-red-900/10 p-1.5 rounded border border-red-500/10">
                    <span className="font-bold mr-1">-</span> {String(ch.old_value)}
                  </div>
                  <div className="text-xs text-emerald-300/80 bg-emerald-900/10 p-1.5 rounded border border-emerald-500/10">
                    <span className="font-bold mr-1">+</span> {String(ch.new_value)}
                  </div>
                  <div className="col-span-2 text-xs text-gray-400 mt-1 italic">
                    <span className="text-purple-400 not-italic">Comment:</span> { (comments[fs.new_path] && Object.values(comments[fs.new_path]).join('; ')) || 'No comments' }
                  </div>
                </div>
              ))}
              {(!fs.semantic_diff?.changes || fs.semantic_diff.changes.length === 0) && (
                <div className="text-xs text-gray-500 italic p-2">No specific key changes detected in summary.</div>
              )}
              </div>
            </div>
          ))}
          
          { (!folderResult?.file_summaries || folderResult.file_summaries.filter(fs => fs.has_changes).length === 0) && (
             <div className="text-center py-10 text-gray-500">No changes found to report.</div>
          )}
        </div>
      </div>
    </div>
  )
}