const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5001/api';

export interface AttachmentMeta {
  _id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  key?: string;
  user?: string | any;
  createdAt: string;
}

/**
 * Uploads a file with progress tracking
 * @param ticketId The ID of the ticket
 * @param file The file object to upload
 * @param token User auth token
 * @param onProgress Callback with progress percentage (0-100)
 * @returns Promise that resolves to the uploaded attachment metadata
 */
export const uploadAttachmentWithProgress = (
  ticketId: string,
  file: File,
  token: string,
  onProgress?: (progress: number) => void
): Promise<AttachmentMeta> => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.open('POST', `${API_URL}/upload/attachments/${ticketId}`);
    xhr.setRequestHeader('Authorization', `Bearer ${token}`);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        const percentComplete = Math.round((event.loaded / event.total) * 100);
        onProgress(percentComplete);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          if (response.success && response.data) {
            resolve(response.data);
          } else {
            reject(new Error(response.error || 'Upload failed'));
          }
        } catch (e) {
          reject(new Error('Invalid response from server'));
        }
      } else {
        try {
          const response = JSON.parse(xhr.responseText);
          reject(new Error(response.error || `Upload failed with status ${xhr.status}`));
        } catch (e) {
          reject(new Error(`Upload failed with status ${xhr.status}`));
        }
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during upload'));
    };

    xhr.send(formData);
  });
};
