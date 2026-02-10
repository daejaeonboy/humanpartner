import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'Humanpartner';

/**
 * 이미지 파일을 Supabase Storage에 업로드
 * @param file 업로드할 파일
 * @returns 업로드된 이미지의 public URL
 */
export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
    // 파일명 중복 방지를 위해 timestamp 추가
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
        });

    if (error) {
        console.error('Upload error:', error);
        throw error;
    }

    // public URL 반환
    const { data: urlData } = supabase.storage
        .from(BUCKET_NAME)
        .getPublicUrl(filePath);

    return urlData.publicUrl;
};

/**
 * Storage에서 이미지 삭제
 * @param imageUrl 삭제할 이미지 URL
 */
export const deleteImage = async (imageUrl: string): Promise<void> => {
    // URL에서 파일 경로 추출
    const url = new URL(imageUrl);
    const pathParts = url.pathname.split('/');
    const bucketIndex = pathParts.indexOf(BUCKET_NAME);

    if (bucketIndex === -1) return;

    const filePath = pathParts.slice(bucketIndex + 1).join('/');

    const { error } = await supabase.storage
        .from(BUCKET_NAME)
        .remove([filePath]);

    if (error) {
        console.error('Delete error:', error);
        throw error;
    }
};
