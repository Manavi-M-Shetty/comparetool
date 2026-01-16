import React, { useState } from 'react'
import { useComparison } from '../context/ComparisonContext'
import CompareButton from '../components/CompareButton'

export default function UploadPage(){
  const { oldFolder, newFolder, excelPath, setOldFolder, setNewFolder, setExcelPath, runFolderCompare, missingValidations, folderResult, status, setStatus, runCompareAndUpdate, comments } = useComparison();

  const [localOld, setLocalOld] = useState(oldFolder || '');
  const [localNew, setLocalNew] = useState(newFolder || '');
  const [localExcel, setLocalExcel] = useState(excelPath || '');

  const handleCompare = async () => {
    if (!localOld || !localNew){
      setStatus({ type: 'error', message: 'Please provide both OLD and NEW folder paths' });
      return;
    }
    try{
      await runFolderCompare(localOld, localNew);
    }catch(e){/* handled in context */}
  };

  const handleCompareAndUpdate = async ()=>{
    if (!localOld || !localNew) return;

    const missingFiles = [ ...(folderResult?.old_only_files || []), ...(folderResult?.new_only_files || []) ];
    const allValidated = missingFiles.length === 0 || missingFiles.every(m => !!missingValidations[m.file_path]);
    if (localExcel && missingFiles.length > 0 && !allValidated){
      setStatus({ type: 'error', message: 'All missing files must be reviewed before generating the Excel report.' });
      return;
    }

    // build validations list
    const payloadValidations = Object.keys(missingValidations).map(k => ({ file_path: k, validated: !!missingValidations[k] }));
    try{
      await runCompareAndUpdate(payloadValidations, comments);
    }catch(e){}
  };

  return (
    <div className="max-w-7xl mx-auto p-4">
      <div className="bg-white rounded-lg shadow-md p-4">
        <h2 className="text-lg font-semibold">Upload / Scan</h2>
        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="text-xs">OLD folder</label>
            <input type="text" value={localOld} onChange={(e)=>setLocalOld(e.target.value)} className="w-full border px-2 py-1 text-xs" placeholder="C:\\path\\to\\old" />
          </div>
          <div>
            <label className="text-xs">NEW folder</label>
            <input type="text" value={localNew} onChange={(e)=>setLocalNew(e.target.value)} className="w-full border px-2 py-1 text-xs" placeholder="C:\\path\\to\\new" />
          </div>
          <div>
            <label className="text-xs">Excel path (optional)</label>
            <input type="text" value={localExcel} onChange={(e)=>setLocalExcel(e.target.value)} className="w-full border px-2 py-1 text-xs" placeholder="C:\\path\\to\\workbook.xlsx" />
          </div>
          <div className="flex items-end gap-2">
            <CompareButton onClick={handleCompare} />
            <CompareButton onClick={handleCompareAndUpdate} >Compare and Update</CompareButton>
          </div>
        </div>
      </div>
      <div className="mt-4 text-sm text-gray-600">{status?.message}</div>
    </div>
  )
}
