import { supabase } from "../lib/supabase";

type ResizeMode = "cover" | "contain" | "fill";

interface ResponsiveImageOptions {
  widths: number[];
  sizes: string;
  height?: number;
  quality?: number;
  resize?: ResizeMode;
}

interface StoragePathInfo {
  bucket: string;
  objectPath: string;
}

const STORAGE_PUBLIC_PATTERN =
  /\/storage\/v1\/(?:object|render\/image)\/public\/([^/]+)\/(.+)$/;

const normalizeWidths = (widths: number[]) =>
  Array.from(
    new Set(
      widths
        .map((width) => Math.round(width))
        .filter((width) => Number.isFinite(width) && width > 0),
    ),
  ).sort((left, right) => left - right);

const extractStoragePath = (imageUrl: string): StoragePathInfo | null => {
  try {
    const parsedUrl = new URL(imageUrl);
    const match = parsedUrl.pathname.match(STORAGE_PUBLIC_PATTERN);

    if (!match) {
      return null;
    }

    return {
      bucket: decodeURIComponent(match[1]),
      objectPath: decodeURIComponent(match[2]),
    };
  } catch {
    return null;
  }
};

const buildTransformedImageUrl = (
  imageUrl: string,
  width: number,
  options: Pick<ResponsiveImageOptions, "height" | "quality" | "resize">,
) => {
  const storagePath = extractStoragePath(imageUrl);

  if (!storagePath) {
    return imageUrl;
  }

  const effectiveResizeMode = options.height
    ? options.resize
    : "contain";

  const { data } = supabase.storage.from(storagePath.bucket).getPublicUrl(
    storagePath.objectPath,
    {
      transform: {
        width,
        ...(options.height ? { height: options.height } : {}),
        ...(options.quality ? { quality: options.quality } : {}),
        // width만 사용하는 화면에서는 Supabase 기본 동작/cover 조합이 과도한 크롭을 만들 수 있다.
        // 이 경우에는 contain으로 변형본 비율을 보존하고, 실제 크롭은 브라우저 레이아웃이 담당한다.
        ...(effectiveResizeMode ? { resize: effectiveResizeMode } : {}),
      },
    },
  );

  return data.publicUrl;
};

export const getResponsiveImageProps = (
  imageUrl?: string | null,
  options?: ResponsiveImageOptions,
) => {
  if (!imageUrl || !options) {
    return {
      src: imageUrl || undefined,
    };
  }

  const widths = normalizeWidths(options.widths);

  if (widths.length === 0) {
    return {
      src: imageUrl,
    };
  }

  const variants = widths.map((width) => ({
    width,
    src: buildTransformedImageUrl(imageUrl, width, options),
  }));

  return {
    src: variants[variants.length - 1]?.src || imageUrl,
    srcSet: variants.map((variant) => `${variant.src} ${variant.width}w`).join(", "),
    sizes: options.sizes,
  };
};
