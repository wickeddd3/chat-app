export const createUploadPath = (userId: string, file: File): string => {
  // Generate a unique file path for the uploaded file
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}${Math.random()}.${fileExt}`;
  const filePath = `${userId}/${fileName}`;
  return filePath;
};

export const generatePreview = (file: File): string => {
  return URL.createObjectURL(file);
};

export const getFileData = (e: React.ChangeEvent<HTMLInputElement>) => {
  if (e.target.files && e.target.files[0]) {
    return e.target.files[0];
  }
  return null;
};
