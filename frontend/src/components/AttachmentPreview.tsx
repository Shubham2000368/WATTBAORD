import React from 'react';
import { X, Download, FileText } from 'lucide-react';
import { Attachment } from '@/services/ticketService';

interface PreviewProps {
  attachment: Attachment;
  onClose: () => void;
}

export const AttachmentPreviewModal: React.FC<PreviewProps> = ({ attachment, onClose }) => {
  const isImage = attachment.type.startsWith('image/');
  const isPDF = attachment.type === 'application/pdf';

  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex items-center justify-center z-50 p-6">
      <div className="bg-white rounded-3xl w-full max-w-5xl h-[85vh] flex flex-col shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
        <div className="px-8 py-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h3 className="font-black text-slate-900 text-lg leading-tight truncate max-w-md">{attachment.name}</h3>
            <p className="text-xs text-slate-400 font-semibold uppercase mt-0.5">{(attachment.size / 1024).toFixed(1)} KB • {attachment.type}</p>
          </div>
          <div className="flex items-center gap-2">
            <a href={attachment.url} download={attachment.name} className="p-2 hover:bg-slate-50 text-slate-500 hover:text-indigo-600 rounded-xl transition-all">
              <Download size={20} />
            </a>
            <button onClick={onClose} className="p-2 hover:bg-slate-50 text-slate-400 hover:text-slate-900 rounded-xl transition-all">
              <X size={20} />
            </button>
          </div>
        </div>
        <div className="flex-1 bg-slate-50 p-8 flex items-center justify-center overflow-auto">
          {isImage ? (
            <img src={attachment.url} alt={attachment.name} className="max-w-full max-h-full object-contain rounded-2xl drop-shadow-xl" />
          ) : isPDF ? (
            <iframe src={`${attachment.url}#toolbar=0`} className="w-full h-full rounded-2xl border border-slate-200" title={attachment.name} />
          ) : attachment.type.startsWith('video/') ? (
            <video src={attachment.url} controls className="w-full max-h-[75vh] rounded-2xl drop-shadow-xl" autoPlay />
          ) : (
            <div className="text-center p-12 bg-white rounded-3xl border border-slate-100 max-w-md shadow-lg shadow-slate-100">
              <FileText size={64} className="text-indigo-400 mx-auto mb-4" />
              <h4 className="font-bold text-slate-900 mb-2">Preview Unavailable</h4>
              <p className="text-sm text-slate-400 leading-relaxed mb-6">We don't support inline previews for this file type yet. Please download it to view.</p>
              <a href={attachment.url} download={attachment.name} className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl inline-flex items-center gap-2 shadow-lg shadow-indigo-100 transition-all">
                <Download size={16} />
                <span>Download File</span>
              </a>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
