import { createHash } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
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
const REPAIRED_CONFIG = { maxWidth: 2000, quality: 92 };
const WEBP_DIMENSION_LIMIT = 16383;

if (APPLY_CHANGES && !SUPABASE_SERVICE_ROLE_KEY) {
  console.error('SUPABASE_SERVICE_ROLE_KEY 또는 SUPABASE_SECRET_KEY 환경 변수가 필요합니다.');
  console.error('예시: $env:SUPABASE_SECRET_KEY="..." ; npm run repair:description-images -- --apply');
  process.exit(1);
}

const supabase = SUPABASE_SERVICE_ROLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
      auth: { persistSession: false, autoRefreshToken: false },
    })
  : null;

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

function isOptimizedDescriptionImage(url) {
  return (
    typeof url === 'string' &&
    url.startsWith(`${PUBLIC_URL_PREFIX}description-images/optimized/`) &&
    url.toLowerCase().endsWith('.webp')
  );
}

function buildRepairedPath(originalUrl) {
  const storagePath = decodeURIComponent(originalUrl.slice(PUBLIC_URL_PREFIX.length));
  const hash = createHash('sha1').update(storagePath).digest('hex').slice(0, 16);
  return `description-images/optimized-v2/${hash}.webp`;
}

async function findLatestMigrationReport() {
  const entries = await readdir(REPORT_DIR);
  const reportNames = entries
    .filter((name) => /^image-migration-\d+\.json$/.test(name))
    .sort((left, right) => left.localeCompare(right));

  if (reportNames.length === 0) {
    throw new Error('image-migration 리포트를 찾지 못했습니다.');
  }

  return path.join(REPORT_DIR, reportNames.at(-1));
}

async function loadOptimizedToOriginalMap(reportPath) {
  const report = JSON.parse(await readFile(reportPath, 'utf8'));
  const urlMap = new Map();

  for (const result of report.optimizationResults || []) {
    if (
      result?.status === 'optimized' &&
      isOptimizedDescriptionImage(result.optimizedUrl) &&
      typeof result.originalUrl === 'string' &&
      result.originalUrl.startsWith(`${PUBLIC_URL_PREFIX}description-images/`)
    ) {
      urlMap.set(result.optimizedUrl, result.originalUrl);
    }
  }

  return urlMap;
}

async function fetchAllProducts() {
  if (!supabase) {
    return [];
  }

  const rows = [];
  let from = 0;

  while (true) {
    const to = from + PAGE_SIZE - 1;
    const { data, error } = await supabase
      .from('products')
      .select('id,description')
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

async function rebuildDescriptionImage(originalUrl) {
  const response = await fetch(originalUrl);
  if (!response.ok) {
    return { status: 'failed', reason: `download-${response.status}`, originalUrl };
  }

  const originalBuffer = Buffer.from(await response.arrayBuffer());
  const originalMetadata = await sharp(originalBuffer).metadata();
  const projectedScale = Math.min(
    1,
    REPAIRED_CONFIG.maxWidth / (originalMetadata.width || 1),
  );
  const projectedHeight = Math.max(1, Math.round((originalMetadata.height || 1) * projectedScale));

  if (projectedHeight > WEBP_DIMENSION_LIMIT) {
    return {
      status: 'restored-original',
      originalUrl,
      repairedUrl: originalUrl,
      originalBytes: originalBuffer.length,
      repairedBytes: originalBuffer.length,
      originalWidth: originalMetadata.width,
      originalHeight: originalMetadata.height,
      repairedWidth: originalMetadata.width,
      repairedHeight: originalMetadata.height,
      savedBytes: 0,
      reason: 'height-limit',
    };
  }

  const repairedBuffer = await sharp(originalBuffer)
    .rotate()
    .resize({
      width: REPAIRED_CONFIG.maxWidth,
      fit: 'inside',
      withoutEnlargement: true,
    })
    .webp({ quality: REPAIRED_CONFIG.quality })
    .toBuffer();

  const repairedPath = buildRepairedPath(originalUrl);

  if (APPLY_CHANGES) {
    const { error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(repairedPath, repairedBuffer, {
        contentType: 'image/webp',
        cacheControl: '31536000',
        upsert: true,
      });

    if (uploadError) {
      return { status: 'failed', reason: uploadError.message, originalUrl };
    }
  }

  const { data: publicUrlData } = supabase.storage.from(BUCKET_NAME).getPublicUrl(repairedPath);
  const repairedMetadata = await sharp(repairedBuffer).metadata();

  return {
    status: 'repaired',
    originalUrl,
    repairedUrl: publicUrlData.publicUrl,
    originalBytes: originalBuffer.length,
    repairedBytes: repairedBuffer.length,
    originalWidth: originalMetadata.width,
    originalHeight: originalMetadata.height,
    repairedWidth: repairedMetadata.width,
    repairedHeight: repairedMetadata.height,
    savedBytes: originalBuffer.length - repairedBuffer.length,
  };
}

async function main() {
  const reportPath = await findLatestMigrationReport();
  const optimizedToOriginalMap = await loadOptimizedToOriginalMap(reportPath);

  console.log(`[description-repair] mode=${APPLY_CHANGES ? 'apply' : 'dry-run'} report=${path.basename(reportPath)}`);
  console.log(`[description-repair] mappedUrls=${optimizedToOriginalMap.size}`);

  if (!supabase) {
    throw new Error('apply 모드가 아니어도 products 조회를 위해 Supabase 키가 필요합니다.');
  }

  const products = await fetchAllProducts();
  const affectedRows = products.filter((row) =>
    extractDescriptionImageUrls(row.description).some((url) => isOptimizedDescriptionImage(url) && optimizedToOriginalMap.has(url)),
  );

  const affectedUrls = Array.from(
    new Set(
      affectedRows.flatMap((row) =>
        extractDescriptionImageUrls(row.description).filter((url) => isOptimizedDescriptionImage(url) && optimizedToOriginalMap.has(url)),
      ),
    ),
  );

  console.log(`[description-repair] affectedRows=${affectedRows.length} affectedUrls=${affectedUrls.length}`);

  const repairedUrlMap = new Map();
  const repairResults = [];
  const unresolvedUrls = [];

  for (const optimizedUrl of affectedUrls) {
    const originalUrl = optimizedToOriginalMap.get(optimizedUrl);
    if (!originalUrl) {
      unresolvedUrls.push(optimizedUrl);
      continue;
    }

    const result = await rebuildDescriptionImage(originalUrl);
    repairResults.push({
      optimizedUrl,
      ...result,
    });

    if (result.status === 'repaired' || result.status === 'restored-original') {
      repairedUrlMap.set(optimizedUrl, result.repairedUrl);
      const deltaKb = ((result.savedBytes || 0) / 1024).toFixed(1);
      console.log(`[description-repair] ${result.status} ${optimizedUrl} -> ${result.repairedUrl} (-${deltaKb} KB vs original)`);
    } else {
      console.log(`[description-repair] failed ${optimizedUrl} (${result.reason})`);
    }
  }

  const rowUpdates = [];

  for (const row of affectedRows) {
    const nextDescription = replaceDescriptionImageUrls(row.description, repairedUrlMap);
    if (nextDescription === row.description) {
      continue;
    }

    rowUpdates.push({
      table: 'products',
      id: row.id,
      updates: {
        description: nextDescription,
      },
    });
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
    reportPath,
    mappedUrls: optimizedToOriginalMap.size,
    affectedRows: affectedRows.length,
    affectedUrls: affectedUrls.length,
    repairedAssets: repairResults.filter((result) => result.status === 'repaired').length,
    restoredOriginalAssets: repairResults.filter((result) => result.status === 'restored-original').length,
    failedAssets: repairResults.filter((result) => result.status === 'failed').length,
    updatedRows: rowUpdates.length,
    unresolvedUrls,
    generatedAt: new Date().toISOString(),
  };

  await mkdir(REPORT_DIR, { recursive: true });
  const reportFile = path.join(REPORT_DIR, `description-image-repair-${Date.now()}.json`);
  await writeFile(
    reportFile,
    JSON.stringify(
      {
        summary,
        rowUpdates,
        repairResults,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log(`[description-repair] summary=${JSON.stringify(summary)}`);
  console.log(`[description-repair] report=${reportFile}`);
}

main().catch((error) => {
  console.error('[description-repair] failed', error);
  process.exit(1);
});
