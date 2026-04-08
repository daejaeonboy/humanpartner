import { supabase } from '../lib/supabase';

const BUCKET_NAME = 'Humanpartner';
const RAW_UPLOAD_MIME_TYPES = new Set(['application/pdf', 'image/svg+xml', 'image/gif']);

type ImageConfig = {
    maxDimension?: number;
    maxWidth?: number;
    maxHeight?: number;
    skipOptimizationWhenHeightExceeds?: number;
    quality: number;
    outputMimeType: string;
};

const DEFAULT_IMAGE_CONFIG: ImageConfig = {
    maxDimension: 1600,
    quality: 0.82,
    outputMimeType: 'image/webp',
};

const IMAGE_CONFIG_BY_FOLDER: Record<string, ImageConfig> = {
    products: { maxDimension: 1600, quality: 0.82, outputMimeType: 'image/webp' },
    // 상세 본문 이미지는 세로로 긴 경우가 많아서 longest-edge 축소를 쓰면 폭이 심하게 무너진다.
    'description-images': {
        maxWidth: 2000,
        skipOptimizationWhenHeightExceeds: 16383,
        quality: 0.92,
        outputMimeType: 'image/webp',
    },
    banners: { maxDimension: 1920, quality: 0.82, outputMimeType: 'image/webp' },
    popups: { maxDimension: 1920, quality: 0.82, outputMimeType: 'image/webp' },
    notices: { maxDimension: 1920, quality: 0.82, outputMimeType: 'image/webp' },
    'installation-cases': { maxDimension: 1920, quality: 0.82, outputMimeType: 'image/webp' },
    'quick-menu': { maxDimension: 800, quality: 0.9, outputMimeType: 'image/webp' },
    'alliance-logos': { maxDimension: 1000, quality: 0.9, outputMimeType: 'image/webp' },
    'business-licenses': { maxDimension: 2200, quality: 0.92, outputMimeType: 'image/webp' },
};

const MIME_EXTENSION_MAP: Record<string, string> = {
    'image/webp': 'webp',
    'image/jpeg': 'jpg',
    'image/png': 'png',
};

const shouldOptimizeImage = (file: File) =>
    file.type.startsWith('image/') && !RAW_UPLOAD_MIME_TYPES.has(file.type);

const getImageConfig = (folder: string) => IMAGE_CONFIG_BY_FOLDER[folder] || DEFAULT_IMAGE_CONFIG;

const getTargetDimensions = (
    width: number,
    height: number,
    { maxDimension, maxWidth, maxHeight }: ImageConfig,
) => {
    const scales = [1];

    if (maxDimension && Math.max(width, height) > maxDimension) {
        scales.push(maxDimension / Math.max(width, height));
    }

    if (maxWidth && width > maxWidth) {
        scales.push(maxWidth / width);
    }

    if (maxHeight && height > maxHeight) {
        scales.push(maxHeight / height);
    }

    const scale = Math.min(...scales);

    return {
        targetWidth: Math.max(1, Math.round(width * scale)),
        targetHeight: Math.max(1, Math.round(height * scale)),
    };
};

const replaceFileExtension = (fileName: string, extension: string) => {
    const dotIndex = fileName.lastIndexOf('.');
    const baseName = dotIndex >= 0 ? fileName.slice(0, dotIndex) : fileName;
    return `${baseName}.${extension}`;
};

const loadImageElement = async (file: File): Promise<HTMLImageElement> => {
    const objectUrl = URL.createObjectURL(file);

    try {
        return await new Promise<HTMLImageElement>((resolve, reject) => {
            const image = new Image();
            image.onload = () => resolve(image);
            image.onerror = () => reject(new Error('이미지를 읽지 못했습니다.'));
            image.src = objectUrl;
        });
    } finally {
        URL.revokeObjectURL(objectUrl);
    }
};

const canvasToBlob = (canvas: HTMLCanvasElement, type: string, quality: number) =>
    new Promise<Blob | null>((resolve) => {
        canvas.toBlob((blob) => resolve(blob), type, quality);
    });

const optimizeImageFile = async (file: File, folder: string): Promise<File> => {
    if (!shouldOptimizeImage(file)) {
        return file;
    }

    const config = getImageConfig(folder);
    const { quality, outputMimeType, skipOptimizationWhenHeightExceeds } = config;
    const image = await loadImageElement(file);
    const { targetWidth, targetHeight } = getTargetDimensions(
        image.naturalWidth,
        image.naturalHeight,
        config,
    );

    if (skipOptimizationWhenHeightExceeds && targetHeight > skipOptimizationWhenHeightExceeds) {
        return file;
    }

    const canvas = document.createElement('canvas');

    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext('2d');
    if (!context) {
        return file;
    }

    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const blob = await canvasToBlob(canvas, outputMimeType, quality);
    if (!blob || blob.size >= file.size) {
        return file;
    }

    const outputExtension = MIME_EXTENSION_MAP[outputMimeType] || file.name.split('.').pop() || 'bin';

    return new File([blob], replaceFileExtension(file.name, outputExtension), {
        type: outputMimeType,
        lastModified: file.lastModified,
    });
};

/**
 * 이미지 파일을 Supabase Storage에 업로드
 * @param file 업로드할 파일
 * @returns 업로드된 이미지의 public URL
 */
export const uploadImage = async (file: File, folder: string = 'products'): Promise<string> => {
    const fileToUpload = await optimizeImageFile(file, folder);

    // 파일명 중복 방지를 위해 timestamp 추가
    const timestamp = Date.now();
    const extension = fileToUpload.name.split('.').pop();
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}.${extension}`;
    const filePath = `${folder}/${fileName}`;

    const { data, error } = await supabase.storage
        .from(BUCKET_NAME)
        .upload(filePath, fileToUpload, {
            cacheControl: '31536000',
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
