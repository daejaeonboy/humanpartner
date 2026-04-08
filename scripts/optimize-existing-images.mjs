import { createHash } from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';

const ROOT_DIR = process.cwd();
const REPORT_DIR = path.join(ROOT_DIR, '.agent', 'reports');
const SUPABASE_URL = process.env.SUPABASE_URL || 'https://zwxvjlnzhjmsuwjnwvqv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;
const BUCKET_NAME = process.env.SUPABASE_BUCKET || 'Humanpartner';
const APPLY_CHANGES = process.argv.includes('--apply');
const LIMIT_FLAG_INDEX = process.argv.indexOf('--limit');
const LIMIT = LIMIT_FLAG_INDEX >= 0 ? Number.parseInt(process.argv[LIMIT_FLAG_INDEX + 1] || '', 10) : null;
const PAGE_SIZE = 200;
const PUBLIC_URL_PREFIX = `${SUPABASE_URL}/storage/v1/object/public/${BUCKET_NAME}/`;

const WEBP_DIMENSION_LIMIT = 16383;

const IMAGE_CONFIG_BY_FOLDER = {
  products: { maxDimension: 1600, quality: 82 },
  'description-images': { maxWidth: 2000, quality: 92, skipOptimizationWhenHeightExceeds: WEBP_DIMENSION_LIMIT },
  banners: { maxDimension: 1920, quality: 82 },
  popups: { maxDimension: 1920, quality: 82 },
  'quick-menu': { maxDimension: 800, quality: 90 },
  'alliance-logos': { maxDimension: 1000, quality: 90 },
  'business-licenses': { maxDimension: 2200, quality: 92 },
};

const TABLE_TASKS = [
  {
    table: 'products',
    select: 'id,image_url,description',
    buildUpdates: (row, urlMap) => {
      const updates = {};

      if (row.image_url && urlMap.has(row.image_url)) {
        updates.image_url = urlMap.get(row.image_url);
      }

      if (row.description) {
        const nextDescription = replaceDescriptionImageUrls(row.description, urlMap);
        if (nextDescription !== row.description) {
          updates.description = nextDescription;
        }
      }

      return updates;
    },
    extractUrls: (row) => [
      ...(row.image_url ? [row.image_url] : []),
      ...extractDescriptionImageUrls(row.description),
    ],
  },
  {
    table: 'quick_menu_items',
    select: 'id,image_url',
    buildUpdates: (row, urlMap) =>
      row.image_url && urlMap.has(row.image_url) ? { image_url: urlMap.get(row.image_url) } : {},
    extractUrls: (row) => (row.image_url ? [row.image_url] : []),
  },
  {
    table: 'banners',
    select: 'id,image_url',
    buildUpdates: (row, urlMap) =>
      row.image_url && urlMap.has(row.image_url) ? { image_url: urlMap.get(row.image_url) } : {},
    extractUrls: (row) => (row.image_url ? [row.image_url] : []),
  },
  {
    table: 'popups',
    select: 'id,image_url',
    buildUpdates: (row, urlMap) =>
      row.image_url && urlMap.has(row.image_url) ? { image_url: urlMap.get(row.image_url) } : {},
    extractUrls: (row) => (row.image_url ? [row.image_url] : []),
  },
  {
    table: 'alliance_members',
    select: 'id,logo_url',
    buildUpdates: (row, urlMap) =>
      row.logo_url && urlMap.has(row.logo_url) ? { logo_url: urlMap.get(row.logo_url) } : {},
    extractUrls: (row) => (row.logo_url ? [row.logo_url] : []),
  },
];

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SECRET_KEY 환경 변수가 필요합니다.');
  console.error('예시: $env:SUPABASE_SECRET_KEY="..." ; npm run optimize:images -- --apply');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const shouldOptimizeUrl = (url) =>
  typeof url === 'string' &&
  url.startsWith(PUBLIC_URL_PREFIX) &&
  !url.includes('/optimized/') &&
  !url.toLowerCase().endsWith('.webp');

function extractStoragePath(url) {
  if (!shouldOptimizeUrl(url)) {
    return null;
  }

  return decodeURIComponent(url.slice(PUBLIC_URL_PREFIX.length));
}

function getFolderConfig(storagePath) {
  const [folder = 'products'] = storagePath.split('/');
  return {
    folder,
    ...(IMAGE_CONFIG_BY_FOLDER[folder] || IMAGE_CONFIG_BY_FOLDER.products),
  };
}

function buildResizeOptions(config) {
  if (config.maxWidth || config.maxHeight) {
    return {
      width: config.maxWidth,
      height: config.maxHeight,
      fit: 'inside',
      withoutEnlargement: true,
    };
  }

  return {
    width: config.maxDimension,
    height: config.maxDimension,
    fit: 'inside',
    withoutEnlargement: true,
  };
}

function buildOptimizedPath(storagePath) {
  const { folder } = getFolderConfig(storagePath);
  const hash = createHash('sha1').update(storagePath).digest('hex').slice(0, 16);
  return `${folder}/optimized/${hash}.webp`;
}

function extractDescriptionImageUrls(html = '') {
  const urls = [];
  const regex = /<img[^>]+src=["']([^"']+)["']/gi;
  let match;

  while ((match = regex.exec(html)) !== null) {
    if (match[1]) {
      urls.push(match[1]);
    }
  }

  return urls;
}

function replaceDescriptionImageUrls(html = '', urlMap) {
  if (!html) return html;

  return html.replace(/(<img[^>]+src=["'])([^"']+)(["'])/gi, (fullMatch, prefix, src, suffix) => {
    const nextUrl = urlMap.get(src);
    if (!nextUrl) {
      return fullMatch;
    }

    return `${prefix}${nextUrl}${suffix}`;
  });
}

async function fetchAllRows(task) {
  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from(task.table)
      .select(task.select)
      .order('id', { ascending: true })
      .range(from, to);

    if (error) {
      throw error;
    }

    const pageRows = data || [];
    rows.push(...pageRows);

    if (LIMIT && rows.length >= LIMIT) {
      return rows.slice(0, LIMIT);
    }

    if (pageRows.length < PAGE_SIZE) {
      return rows;
    }

    from += PAGE_SIZE;
  }
}

async function optimizeImageFromUrl(url) {
  const storagePath = extractStoragePath(url);
  if (!storagePath) {
    return { status: 'skipped', reason: 'unsupported-url', originalUrl: url };
  }

  const response = await fetch(url);
  if (!response.ok) {
    return { status: 'failed', reason: `download-${response.status}`, originalUrl: url };
  }

  const contentType = response.headers.get('content-type') || '';
  if (!contentType.startsWith('image/') || contentType.includes('gif') || contentType.includes('svg')) {
    return { status: 'skipped', reason: `content-type:${contentType || 'unknown'}`, originalUrl: url };
  }

  const originalBuffer = Buffer.from(await response.arrayBuffer());
  const { maxDimension, quality, maxWidth, maxHeight, skipOptimizationWhenHeightExceeds } = getFolderConfig(storagePath);
  const metadata = await sharp(originalBuffer).metadata();
  const projectedScale = Math.min(
    1,
    maxDimension ? maxDimension / Math.max(metadata.width || 1, metadata.height || 1) : 1,
    maxWidth ? maxWidth / (metadata.width || 1) : 1,
    maxHeight ? maxHeight / (metadata.height || 1) : 1,
  );
  const projectedHeight = Math.max(1, Math.round((metadata.height || 1) * projectedScale));

  if (skipOptimizationWhenHeightExceeds && projectedHeight > skipOptimizationWhenHeightExceeds) {
    return {
      status: 'skipped',
      reason: 'height-limit',
      originalUrl: url,
      originalBytes: originalBuffer.length,
    };
  }

  const optimizedBuffer = await sharp(originalBuffer)
    .rotate()
    .resize(buildResizeOptions(getFolderConfig(storagePath)))
    .webp({ quality })
    .toBuffer();

  if (optimizedBuffer.length >= originalBuffer.length) {
    return {
      status: 'skipped',
      reason: 'no-size-gain',
      originalUrl: url,
      originalBytes: originalBuffer.length,
      optimizedBytes: optimizedBuffer.length,
    };
  }

  const optimizedPath = buildOptimizedPath(storagePath);

  if (APPLY_CHANGES) {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(optimizedPath, optimizedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      return { status: 'failed', reason: uploadError.message, originalUrl: url };
    }
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(optimizedPath);

  return {
    status: 'optimized',
    originalUrl: url,
    optimizedUrl: publicUrlData.publicUrl,
    originalBytes: originalBuffer.length,
    optimizedBytes: optimizedBuffer.length,
    savedBytes: originalBuffer.length - optimizedBuffer.length,
  };
}

async function main() {
  console.log(`[image-migration] mode=${APPLY_CHANGES ? 'apply' : 'dry-run'} bucket=${BUCKET_NAME}`);

  const tableRows = await Promise.all(
    TABLE_TASKS.map(async (task) => ({
      task,
      rows: await fetchAllRows(task),
    })),
  );

  const uniqueUrls = Array.from(
    new Set(
      tableRows.flatMap(({ task, rows }) => rows.flatMap((row) => task.extractUrls(row))).filter(shouldOptimizeUrl),
    ),
  );

  console.log(`[image-migration] rows=${tableRows.reduce((sum, item) => sum + item.rows.length, 0)} uniqueUrls=${uniqueUrls.length}`);

  const optimizationResults = [];
  const optimizedUrlMap = new Map();

  for (const url of uniqueUrls) {
    const result = await optimizeImageFromUrl(url);
    optimizationResults.push(result);

    if (result.status === 'optimized' && result.optimizedUrl) {
      optimizedUrlMap.set(url, result.optimizedUrl);
      const savedKb = ((result.savedBytes || 0) / 1024).toFixed(1);
      console.log(`[image-migration] optimized ${url} -> ${result.optimizedUrl} (-${savedKb} KB)`);
    } else {
      console.log(`[image-migration] ${result.status} ${url} (${result.reason})`);
    }
  }

  const rowUpdates = [];

  for (const { task, rows } of tableRows) {
    for (const row of rows) {
      const updates = task.buildUpdates(row, optimizedUrlMap);
      if (Object.keys(updates).length === 0) {
        continue;
      }

      rowUpdates.push({
        table: task.table,
        id: row.id,
        updates,
      });
    }
  }

  if (APPLY_CHANGES) {
    for (const update of rowUpdates) {
      const { error } = await supabase
        .from(update.table)
        .update(update.updates)
        .eq('id', update.id);

      if (error) {
        throw new Error(`[${update.table}:${update.id}] ${error.message}`);
      }
    }
  }

  const summary = {
    mode: APPLY_CHANGES ? 'apply' : 'dry-run',
    uniqueUrls: uniqueUrls.length,
    optimizedAssets: optimizationResults.filter((item) => item.status === 'optimized').length,
    skippedAssets: optimizationResults.filter((item) => item.status === 'skipped').length,
    failedAssets: optimizationResults.filter((item) => item.status === 'failed').length,
    updatedRows: rowUpdates.length,
    savedBytes: optimizationResults.reduce((sum, item) => sum + (item.savedBytes || 0), 0),
    generatedAt: new Date().toISOString(),
  };

  await mkdir(REPORT_DIR, { recursive: true });
  const reportPath = path.join(REPORT_DIR, `image-migration-${Date.now()}.json`);
  await writeFile(
    reportPath,
    JSON.stringify(
      {
        summary,
        rowUpdates,
        optimizationResults,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`[image-migration] summary=${JSON.stringify(summary)}`);
  console.log(`[image-migration] report=${reportPath}`);
}

main().catch((error) => {
  console.error('[image-migration] failed:', error);
  process.exit(1);
});
