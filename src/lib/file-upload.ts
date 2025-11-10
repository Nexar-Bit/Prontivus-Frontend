/**
 * File upload utility
 */
import { getAccessToken } from './auth';

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface UploadedFile {
  name: string;
  type: string;
  url: string;
  size: number;
}

/**
 * Upload a file and return the file URL
 */
export async function uploadFile(
  file: File,
  patientId?: number
): Promise<UploadedFile> {
  const formData = new FormData();
  formData.append('file', file);
  
  if (patientId) {
    formData.append('patient_id', patientId.toString());
  }

  const token = getAccessToken();
  if (!token) {
    throw new Error('Authentication required');
  }

  const response = await fetch(`${API_URL}/api/files/upload${patientId ? `?patient_id=${patientId}` : ''}`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
    },
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `HTTP error! status: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        errorMessage = typeof errorData.detail === 'string' 
          ? errorData.detail 
          : JSON.stringify(errorData.detail);
      } else if (errorData.message) {
        errorMessage = errorData.message;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }
    throw new Error(errorMessage);
  }

  const data = await response.json();
  
  // Construct the file URL
  const fileUrl = data.stored_path 
    ? `${API_URL}/api/files/${data.id}`
    : data.url || '#';

  return {
    name: data.filename || file.name,
    type: file.type.startsWith("image/") ? "image" : file.type === "application/pdf" ? "pdf" : "document",
    url: fileUrl,
    size: file.size,
  };
}

/**
 * Upload multiple files
 */
export async function uploadFiles(
  files: File[],
  patientId?: number
): Promise<UploadedFile[]> {
  return Promise.all(files.map(file => uploadFile(file, patientId)));
}

