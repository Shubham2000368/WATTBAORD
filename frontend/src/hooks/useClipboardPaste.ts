import { useEffect, useCallback } from 'react';

interface UseClipboardPasteProps {
  onPasteFiles: (files: File[]) => void;
  enabled?: boolean;
}

export const useClipboardPaste = ({ onPasteFiles, enabled = true }: UseClipboardPasteProps) => {
  const handlePaste = useCallback((e: ClipboardEvent) => {
    if (!enabled) return;

    // Check if the user is typing in a text input or textarea other than the comment box
    // Actually, we usually want to allow pasting if they are focused on the page or the comment box
    // But if they are typing in an input, we shouldn't intercept text paste.
    // However, for image paste, we want to intercept it anywhere.
    
    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1 || items[i].type.indexOf('video') !== -1 || items[i].type.indexOf('application/pdf') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          files.push(file);
        }
      }
    }

    if (files.length > 0) {
      e.preventDefault(); // Prevent default paste if we found files (prevents putting base64 image in contenteditables if any)
      onPasteFiles(files);
    }
  }, [enabled, onPasteFiles]);

  useEffect(() => {
    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [handlePaste]);
};
