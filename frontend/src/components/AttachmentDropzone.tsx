import React, { useCallback, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { useClipboardPaste } from '../hooks/useClipboardPaste';

interface AttachmentDropzoneProps {
  onFilesSelected: (files: File[]) => void;
  children?: React.ReactNode;
}

export const AttachmentDropzone: React.FC<AttachmentDropzoneProps> = ({ onFilesSelected, children }) => {
  const [isDragActive, setIsDragActive] = useState(false);

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isDragActive) {
      setIsDragActive(true);
    }
  }, [isDragActive]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const filesArray = Array.from(e.dataTransfer.files);
      onFilesSelected(filesArray);
      e.dataTransfer.clearData();
    }
  }, [onFilesSelected]);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const filesArray = Array.from(e.target.files);
      onFilesSelected(filesArray);
      e.target.value = '';
    }
  }, [onFilesSelected]);

  // Hook handles clipboard paste of images anywhere while this component is rendered.
  useClipboardPaste({ onPasteFiles: onFilesSelected });

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={handleDragOver}
      onDrop={handleDrop}
      className={`relative rounded-xl border-2 border-dashed transition-all duration-200 ${
        isDragActive
          ? 'border-indigo-500 bg-indigo-50/50'
          : 'border-slate-200 hover:border-slate-300 bg-slate-50/30'
      }`}
    >
      {/* File input for click-to-upload */}
      <input
        type="file"
        multiple
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
        onChange={handleFileInput}
        title="Drop files here or click to browse"
      />
      
      {children || (
        <div className="flex flex-col items-center justify-center py-6 px-4 text-center pointer-events-none">
          <UploadCloud className={`w-8 h-8 mb-3 ${isDragActive ? 'text-indigo-500' : 'text-slate-400'}`} />
          <p className="text-sm font-medium text-slate-700">
            Drop files here or click to browse
          </p>
          <p className="text-xs text-slate-500 mt-1">
            You can also paste screenshots (Ctrl+V)
          </p>
          <p className="text-[10px] text-slate-400 mt-2 font-mono uppercase tracking-wider">
            Max: Images 20MB, Docs 50MB, Videos 500MB
          </p>
        </div>
      )}
    </div>
  );
};
