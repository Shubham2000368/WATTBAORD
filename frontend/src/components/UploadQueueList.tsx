import React from 'react';
import { File, Image as ImageIcon, Film, XCircle, RefreshCw, CheckCircle2 } from 'lucide-react';
import { UploadQueueItem } from '../hooks/useAttachmentUpload';

interface UploadQueueListProps {
  queue: UploadQueueItem[];
  onRemove: (id: string) => void;
  onRetry: (id: string) => void;
}

export const UploadQueueList: React.FC<UploadQueueListProps> = ({ queue, onRemove, onRetry }) => {
  if (queue.length === 0) return null;

  return (
    <div className="space-y-2 mt-4">
      {queue.map((item) => {
        const isImage = item.file.type.startsWith('image/');
        const isVideo = item.file.type.startsWith('video/');
        const isSuccess = item.status === 'success';
        const isError = item.status === 'error';

        return (
          <div 
            key={item.id} 
            className={`relative flex items-center p-3 rounded-lg border ${
              isError ? 'border-red-200 bg-red-50/50' : 
              isSuccess ? 'border-green-100 bg-green-50/30' : 
              'border-slate-100 bg-white'
            } shadow-sm overflow-hidden`}
          >
            {/* Progress Bar Background */}
            {item.status === 'uploading' && (
              <div 
                className="absolute inset-y-0 left-0 bg-indigo-50/50 transition-all duration-300 ease-out z-0"
                style={{ width: `${item.progress}%` }}
              />
            )}

            <div className="relative z-10 flex items-center w-full gap-3">
              {/* Preview or Icon */}
              <div className="flex-shrink-0 w-10 h-10 bg-slate-100 rounded overflow-hidden flex items-center justify-center">
                {item.previewUrl && isImage ? (
                  <img src={item.previewUrl} alt="preview" className="w-full h-full object-cover" />
                ) : item.previewUrl && isVideo ? (
                  <video src={item.previewUrl} className="w-full h-full object-cover" muted />
                ) : (
                  isImage ? <ImageIcon size={20} className="text-slate-400" /> :
                  isVideo ? <Film size={20} className="text-slate-400" /> :
                  <File size={20} className="text-slate-400" />
                )}
              </div>

              {/* Details */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">
                  {item.file.name}
                </p>
                <div className="flex items-center text-xs mt-0.5">
                  {isError ? (
                    <span className="text-red-500 font-medium">{item.error || 'Upload failed'}</span>
                  ) : isSuccess ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <CheckCircle2 size={12} /> Uploaded
                    </span>
                  ) : (
                    <span className="text-slate-500">
                      {item.progress}% • {(item.file.size / 1024 / 1024).toFixed(2)} MB
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex-shrink-0 flex items-center gap-1">
                {isError && (
                  <button 
                    onClick={() => onRetry(item.id)}
                    className="p-1.5 text-slate-400 hover:text-indigo-600 rounded-md hover:bg-indigo-50 transition-colors"
                    title="Retry upload"
                  >
                    <RefreshCw size={16} />
                  </button>
                )}
                {!isSuccess && (
                  <button 
                    onClick={() => onRemove(item.id)}
                    className="p-1.5 text-slate-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Cancel upload"
                  >
                    <XCircle size={16} />
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
