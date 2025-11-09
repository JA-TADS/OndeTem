import { cloudinaryConfig } from '../../config/cloudinary.config';

// Função para fazer upload de imagem para Cloudinary
export const uploadImageToCloudinary = async (file: File, folder?: string): Promise<string> => {
  try {
    const formData = new FormData();
    formData.append('file', file);
    
    // Upload preset é necessário para uploads unsigned
    if (cloudinaryConfig.uploadPreset) {
      formData.append('upload_preset', cloudinaryConfig.uploadPreset);
    }
    
    if (folder) {
      formData.append('folder', folder);
    }

    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`;
    
    console.log('Fazendo upload para Cloudinary...', { cloudName: cloudinaryConfig.cloudName });

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('Erro do Cloudinary:', error);
      throw new Error(error.error?.message || 'Erro ao fazer upload da imagem');
    }

    const data = await response.json();
    console.log('Upload bem-sucedido:', data.secure_url);
    return data.secure_url;
  } catch (error) {
    console.error('Erro ao fazer upload para Cloudinary:', error);
    throw error;
  }
};

// Função específica para upload de avatar
export const uploadUserAvatar = async (userId: string, file: File): Promise<string> => {
  return await uploadImageToCloudinary(file, `avatars/${userId}`);
};

