export async function uploadMultipleImages(files: FileList | File[]): Promise<string[]> {
  const formData = new FormData();
  const filesArray = Array.from(files);
  
  filesArray.forEach((file) => {
    formData.append('images', file);
  });

  const response = await fetch('/api/upload-images', {
    method: 'POST',
    credentials: 'include',
    body: formData,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: response.statusText }));
    throw new Error(error.message || 'Failed to upload images');
  }

  const data = await response.json();
  return data.urls;
}
