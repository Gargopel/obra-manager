import { supabase } from "@/integrations/supabase/client";
import { v4 as uuidv4 } from 'uuid';

const BUCKET_NAME = 'app-files';

/**
 * Uploads a file to Supabase Storage and returns the public URL.
 * @param file The file object to upload.
 * @param folder The folder inside the bucket (e.g., 'avatars', 'demands').
 * @returns The public URL of the uploaded file.
 */
export const uploadFile = async (file: File, folder: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${uuidv4()}.${fileExt}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
  }

  // Get the public URL
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(filePath);
    
  return data.publicUrl;
};

/**
 * Deletes a file from Supabase Storage.
 * @param publicUrl The public URL of the file to delete.
 * @returns True if successful.
 */
export const deleteFile = async (publicUrl: string): Promise<boolean> => {
  if (!publicUrl) return true;
  
  // Extract the path relative to the bucket
  const pathSegments = publicUrl.split('/');
  // The path starts after 'storage/v1/object/public/app-files/'
  const bucketIndex = pathSegments.findIndex(segment => segment === BUCKET_NAME);
  
  if (bucketIndex === -1 || bucketIndex + 1 >= pathSegments.length) {
    console.warn("Could not parse storage path from URL:", publicUrl);
    return true; // Assume it's not a Supabase file or already gone
  }
  
  const filePath = pathSegments.slice(bucketIndex + 1).join('/');

  const { error: deleteError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([filePath]);

  if (deleteError) {
    console.error("Error deleting file:", deleteError);
    // We don't throw here, just log, as deletion failure shouldn't block the main operation
    return false;
  }
  return true;
};