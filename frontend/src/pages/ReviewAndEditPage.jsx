import React, { useEffect, useState } from 'react'
import { useSearchParams, useNavigate } from 'react-router-dom'
import { useComparison } from '../context/ComparisonContext'
import DiffViewer from '../components/DiffViewer'
import { saveEditedFile as apiSaveEditedFile } from '../utils/api'

export default function ReviewAndEditPage(){
  const { selectedFile, setSelectedFile, fetchFileDiff, comments, setComment, editedFiles, setEditedContent, setStatus } = useComparison();
  const [localOld, setLocalOld] = useState('');
  const [localNew, setLocalNew] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [localComments, setLocalComments] = useState({});
  const navigate = useNavigate();

  useEffect(()=>{
    if (!selectedFile) return;
    setLocalOld(selectedFile.old_text || '');
    setLocalNew(editedFiles?.[selectedFile.new_path] || selectedFile.new_text || '');
    // initialize comments
    setLocalComments(comments[selectedFile.new_path] || {});
  }, [selectedFile]);

  if (!selectedFile){
    return (
      <div className="max-w-4xl mx-auto p-4">
        <div className="bg-white rounded p-4">No file selected. Go to Results and pick a file to review.</div>
      </div>
    )
  }

  const handleSave = async ()=>{
    setSaving(true);
    try{
      // Validate basic syntax before send - backend will also validate
      const payload = { file_path: selectedFile.new_path, updated_content: localNew };
      await apiSaveEditedFile(payload);
      setEditedContent(selectedFile.new_path, localNew);
      setStatus({ type: 'success', message: 'File saved' });
      setIsEditing(false);
    }catch(e){
      const msg = e?.response?.data?.detail || e.message || 'Save failed';
      setStatus({ type: 'error', message: msg });
    }finally{
      setSaving(false);
    }
  };

  const handleCommentChange = (key, val)=>{
    setLocalComments((c)=> ({...c, [key]: val}));
    setComment(selectedFile.new_path, key, val);
  };

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-4">
      <div className="bg-white rounded p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold">Review & Edit: {selectedFile.file_name}</h3>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-gray-200 rounded" onClick={()=>navigate('/results')}>Back</button>
            <button className="px-3 py-1 bg-blue-600 text-white rounded" onClick={()=>setIsEditing(e=>!e)}>{isEditing ? 'Cancel' : 'Edit NEW'}</button>
            {isEditing && <button className="px-3 py-1 bg-green-600 text-white rounded" onClick={handleSave} disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>}
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-1">OLD</h4>
            <div className="border rounded p-2 text-xs h-[420px] overflow-auto bg-gray-50">{localOld || 'No old content'}</div>
          </div>
          <div>
            <h4 className="text-xs font-medium text-gray-600 mb-1">NEW</h4>
            {!isEditing ? (
              <div className="border rounded p-2 text-xs h-[420px] overflow-auto bg-gray-50">{localNew || 'No new content'}</div>
            ) : (
              <textarea className="w-full h-[420px] text-xs font-mono border rounded p-2" value={localNew} onChange={(e)=>setLocalNew(e.target.value)} />
            )}
          </div>
        </div>

        <div className="mt-4">
          <h4 className="font-semibold text-sm">Comments for semantic changes</h4>
          <div className="mt-2 space-y-2 text-xs">
            { (selectedFile.semantic_diff?.changes || []).length === 0 && <div className="text-gray-500">No semantic changes detected.</div> }
            { (selectedFile.semantic_diff?.changes || []).map((ch, idx)=> (
              <div key={idx} className="p-2 border rounded bg-gray-50">
                <div className="text-[12px] font-medium">{ch.key || (ch.old_key + ' → ' + ch.new_key)}</div>
                <div className="text-[11px] text-gray-600">Old: {String(ch.old_value)}</div>
                <div className="text-[11px] text-gray-600">New: {String(ch.new_value)}</div>
                <div className="mt-2">
                  <textarea placeholder="Explain why this change was made (optional)" className="w-full text-xs rounded border p-1" value={localComments[ch.key || (ch.new_key || '')] || ''} onChange={(e)=>handleCommentChange(ch.key || (ch.new_key || ''), e.target.value)} />
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  )
}
