import { useState, useCallback, useEffect } from 'react';
import { uploadAttachmentWithProgress, AttachmentMeta } from '../services/attachmentService';

export interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
  previewUrl?: string;
  attachmentData?: AttachmentMeta;
}

export const useAttachmentUpload = (ticketId: string, token: string | null) => {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);

  // Cleanup object URLs to avoid memory leaks
  useEffect(() => {
    return () => {
      queue.forEach(item => {
        if (item.previewUrl) {
          URL.revokeObjectURL(item.previewUrl);
        }
      });
    };
  }, []);

  const addFiles = useCallback((files: File[]) => {
    const newItems: UploadQueueItem[] = files.map(file => {
      let previewUrl = '';
      if (file.type.startsWith('image/') || file.type.startsWith('video/')) {
        previewUrl = URL.createObjectURL(file);
      }

      return {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        progress: 0,
        status: 'pending',
        previewUrl
      };
    });

    setQueue(prev => [...prev, ...newItems]);
    
    // Automatically start uploading the newly added items
    newItems.forEach(item => uploadItem(item.id, item.file));
  }, [ticketId, token]);

  const uploadItem = async (id: string, file: File) => {
    if (!token || !ticketId) return;

    setQueue(prev => prev.map(item => 
      item.id === id ? { ...item, status: 'uploading', error: undefined } : item
    ));

    try {
      const data = await uploadAttachmentWithProgress(
        ticketId,
        file,
        token,
        (progress) => {
          setQueue(prev => prev.map(item => 
            item.id === id ? { ...item, progress } : item
          ));
        }
      );

      setQueue(prev => prev.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'success', 
          progress: 100,
          attachmentData: data 
        } : item
      ));

    } catch (error: any) {
      setQueue(prev => prev.map(item => 
        item.id === id ? { 
          ...item, 
          status: 'error', 
          error: error.message || 'Upload failed'
        } : item
      ));
    }
  };

  const removeFile = useCallback((id: string) => {
    setQueue(prev => {
      const item = prev.find(i => i.id === id);
      if (item && item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
      return prev.filter(i => i.id !== id);
    });
  }, []);

  const retryUpload = useCallback((id: string) => {
    const item = queue.find(i => i.id === id);
    if (item && item.status === 'error') {
      uploadItem(id, item.file);
    }
  }, [queue, ticketId, token]);

  const clearQueue = useCallback(() => {
    queue.forEach(item => {
      if (item.previewUrl) {
        URL.revokeObjectURL(item.previewUrl);
      }
    });
    setQueue([]);
  }, [queue]);

  return {
    queue,
    addFiles,
    removeFile,
    retryUpload,
    clearQueue,
    isUploading: queue.some(item => item.status === 'uploading'),
    uploadedAttachments: queue.filter(item => item.status === 'success').map(item => item.attachmentData!)
  };
};
