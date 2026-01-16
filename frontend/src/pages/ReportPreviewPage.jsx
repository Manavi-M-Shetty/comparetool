import React from 'react'
import { useComparison } from '../context/ComparisonContext'

export default function ReportPreviewPage(){
  const { folderResult, comments } = useComparison();

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-white rounded p-4">
        <h3 className="font-semibold mb-2">Excel Report Preview</h3>
        <div className="text-xs text-gray-600">This preview lists changed keys and comments that will be included in the Excel report.</div>

        <div className="mt-4 space-y-3 text-xs">
          { (folderResult?.file_summaries || []).filter(fs => fs.has_changes).map((fs, idx) => (
            <div key={idx} className="p-2 border rounded bg-gray-50">
              <div className="font-medium">{fs.component_name} / {fs.file_name}</div>
              <div className="text-[12px] mt-1">Changes: {fs.summary}</div>
              {/* List semantic changes and comments if any */}
              { fs.semantic_diff?.changes?.map((ch, i) => (
                <div key={i} className="mt-1 text-gray-700">
                  <div className="text-[11px]">Key: {ch.key || (ch.old_key + ' → ' + ch.new_key)}</div>
                  <div className="text-[11px]">Old: {String(ch.old_value)}</div>
                  <div className="text-[11px]">New: {String(ch.new_value)}</div>
                  <div className="text-[11px] text-gray-600">Comment: { (comments[fs.new_path] && Object.values(comments[fs.new_path]).join('; ')) || '-' }</div>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
