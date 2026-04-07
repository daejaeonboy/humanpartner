import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';

const ROOT_DIR = process.cwd();
const DIST_DIR = path.join(ROOT_DIR, 'dist');

const SITE_URL = 'https://miceday.co.kr';
const SITE_NAME = '행사어때';
const SITE_TITLE = '행사어때 | 대전 MICE 행사 통합운영 플랫폼';
const SITE_DESCRIPTION =
  '행사어때는 대전·충청권 MICE 행사에 필요한 기획, 장비 렌탈, 공간 연출, 운영 지원을 한 번에 제공하는 행사 통합운영 플랫폼입니다.';
const DEFAULT_OG_IMAGE = `${SITE_URL}/Miceday_Logo.png`;
const INDEX_ROBOTS =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
const NOINDEX_ROBOTS = 'noindex,follow';

const ORGANIZATION = {
  legalName: SITE_NAME,
  representative: '이기섭',
  phone: '1800-1985',
  officePhone: '010-4074-6967',
  email: 'hm_solution@naver.com',
  address: {
    streetAddress: '대전광역시 대덕구 대화로106번길 66 펜타플렉스 705호',
    postalCode: '34365',
    addressLocality: '대전광역시',
    addressCountry: 'KR',
  },
};

const staticRoutes = [
  {
    route: '/',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    canonical: '/',
    robots: INDEX_ROBOTS,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: SITE_NAME,
        alternateName: ORGANIZATION.legalName,
        url: SITE_URL,
        description: SITE_DESCRIPTION,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: SITE_NAME,
        legalName: ORGANIZATION.legalName,
        alternateName: [SITE_NAME],
        url: SITE_URL,
        logo: DEFAULT_OG_IMAGE,
        email: ORGANIZATION.email,
        telephone: ORGANIZATION.officePhone,
        founder: ORGANIZATION.representative,
        address: {
          '@type': 'PostalAddress',
          streetAddress: ORGANIZATION.address.streetAddress,
          postalCode: ORGANIZATION.address.postalCode,
          addressLocality: ORGANIZATION.address.addressLocality,
          addressCountry: ORGANIZATION.address.addressCountry,
        },
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: ORGANIZATION.phone,
          contactType: 'customer service',
          areaServed: 'KR',
          availableLanguage: ['ko'],
        },
      },
    ],
  },
  {
    route: '/products',
    title: '전체 상품 | 행사어때',
    description:
      '행사어때의 전체 상품 목록입니다. 대전 MICE 행사 운영에 필요한 장비와 서비스를 한 곳에서 비교하고 상담할 수 있습니다.',
    canonical: '/products',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/company',
    title: '회사소개 | 행사어때',
    description:
      '행사어때는 대전·충청권 MICE 행사 운영 경험을 바탕으로 기획, 장비 렌탈, 공간 연출, 운영 지원을 통합 제공하는 플랫폼입니다.',
    canonical: '/company',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/cs',
    title: '고객센터 | 행사어때',
    description:
      '행사어때 고객센터입니다. 자주 묻는 질문, 전화 상담, 채팅 상담 안내를 확인할 수 있습니다.',
    canonical: '/cs',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/alliance',
    title: '대전·충청 MICE 얼라이언스 회원사 소개 | 행사어때',
    description: '대전·충청 MICE 얼라이언스(DCMA) 회원사 소개와 안내를 확인할 수 있습니다.',
    canonical: '/alliance',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/cases',
    title: '설치사례 | 행사어때',
    description: '행사어때 설치사례 페이지입니다. 현장 설치 및 운영 사례를 확인할 수 있습니다.',
    canonical: '/cases',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/notices',
    title: '공지사항 | 행사어때',
    description: '행사어때 공지사항 페이지입니다. 서비스 공지와 운영 소식을 확인할 수 있습니다.',
    canonical: '/notices',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/terms',
    title: '서비스 이용약관 | 행사어때',
    description:
      '행사어때 서비스 이용약관입니다. 회원가입, 예약, 결제, 취소 및 환불, 권리와 의무 사항을 안내합니다.',
    canonical: '/terms',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/privacy',
    title: '개인정보처리방침 | 행사어때',
    description:
      '행사어때 서비스의 개인정보처리방침입니다. 수집 항목, 이용 목적, 보유 기간, 이용자 권리 및 보호조치를 안내합니다.',
    canonical: '/privacy',
    robots: INDEX_ROBOTS,
  },
  {
    route: '/login',
    title: '로그인 | 행사어때',
    description: '행사어때 회원 로그인 페이지입니다.',
    canonical: '/login',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/signup',
    title: '회원가입 | 행사어때',
    description:
      '행사어때 회원가입 페이지입니다. 기업과 공공기관을 위한 행사 통합운영 서비스를 신청할 수 있습니다.',
    canonical: '/signup',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/mypage',
    title: '내 예약 내역 | 행사어때',
    description: '행사어때 회원 전용 예약 내역 페이지입니다.',
    canonical: '/mypage',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/mypage/info',
    title: '내 정보 관리 | 행사어때',
    description: '행사어때 회원 전용 내 정보 관리 페이지입니다.',
    canonical: '/mypage/info',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/mypage/inquiry',
    title: '1:1 문의 내역 | 행사어때',
    description: '행사어때 회원 전용 1:1 문의 페이지입니다.',
    canonical: '/mypage/inquiry',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/search',
    title: '검색 결과 | 행사어때',
    description: '행사어때 사이트 검색 결과 페이지입니다.',
    canonical: '/search',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/event',
    title: '이벤트 준비중 | 행사어때',
    description: '행사어때 이벤트 페이지 준비중입니다.',
    canonical: '/event',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/blank',
    title: '페이지 준비중 | 행사어때',
    description: '행사어때의 신규 페이지 준비중입니다.',
    canonical: '/blank',
    robots: NOINDEX_ROBOTS,
  },
  {
    route: '/404',
    title: '페이지를 찾을 수 없습니다 | 행사어때',
    description: '요청하신 페이지를 찾을 수 없습니다.',
    canonical: '/404',
    robots: NOINDEX_ROBOTS,
  },
];

function escapeHtml(value = '') {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function absoluteUrl(pathOrUrl = '/') {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
}

function stripHtml(value = '') {
  return String(value)
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(value, maxLength = 160) {
  if (!value) return '';
  return value.length <= maxLength ? value : `${value.slice(0, maxLength - 1).trim()}…`;
}

function upsertTag(html, pattern, tag, anchor = '</head>') {
  if (pattern.test(html)) {
    return html.replace(pattern, tag);
  }

  return html.replace(anchor, `  ${tag}\n${anchor}`);
}

function buildJsonLdScripts(schemas = []) {
  if (!schemas.length) return '';

  return `${schemas
    .map(
      (schema) =>
        `  <script type="application/ld+json">${JSON.stringify(schema).replace(/</g, '\\u003c')}</script>`
    )
    .join('\n')}\n`;
}

function renderHtml(baseHtml, meta) {
  const title = escapeHtml(meta.title || SITE_TITLE);
  const description = escapeHtml(meta.description || SITE_DESCRIPTION);
  const canonical = escapeHtml(absoluteUrl(meta.canonical || '/'));
  const robots = escapeHtml(meta.robots || INDEX_ROBOTS);
  const image = escapeHtml(absoluteUrl(meta.image || DEFAULT_OG_IMAGE));
  const type = escapeHtml(meta.type || 'website');
  const jsonLdScripts = buildJsonLdScripts(meta.jsonLd || []);

  let html = baseHtml;

  html = html.replace(/<title>.*?<\/title>/i, `<title>${title}</title>`);
  html = upsertTag(
    html,
    /<link\s+rel="canonical"\s+href=".*?"\s*\/?>/i,
    `<link rel="canonical" href="${canonical}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="description"\s+content=".*?"\s*\/?>/i,
    `<meta name="description" content="${description}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="robots"\s+content=".*?"\s*\/?>/i,
    `<meta name="robots" content="${robots}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:type"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:type" content="${type}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:url"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:url" content="${canonical}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:title"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:title" content="${title}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:description"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:description" content="${description}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+property="og:image"\s+content=".*?"\s*\/?>/i,
    `<meta property="og:image" content="${image}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="twitter:title"\s+content=".*?"\s*\/?>|<meta\s+property="twitter:title"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:title" content="${title}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="twitter:description"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:description" content="${description}" />`
  );
  html = upsertTag(
    html,
    /<meta\s+name="twitter:image"\s+content=".*?"\s*\/?>/i,
    `<meta name="twitter:image" content="${image}" />`
  );

  if (jsonLdScripts) {
    html = html.replace('</head>', `${jsonLdScripts}</head>`);
  }

  return html;
}

async function writeRouteHtml(route, html) {
  if (route === '/') {
    await writeFile(path.join(DIST_DIR, 'index.html'), html, 'utf8');
    return;
  }

  const relativePath = route.replace(/^\/+/, '');
  const outputDir = path.join(DIST_DIR, relativePath);
  await mkdir(outputDir, { recursive: true });
  await writeFile(path.join(outputDir, 'index.html'), html, 'utf8');

  if (route === '/404') {
    await writeFile(path.join(DIST_DIR, '404.html'), html, 'utf8');
  }
}

async function readSupabaseConfig() {
  try {
    const source = await readFile(path.join(ROOT_DIR, 'src', 'lib', 'supabase.ts'), 'utf8');
    const urlMatch = source.match(/const supabaseUrl = '([^']+)'/);
    const keyMatch = source.match(/const supabaseAnonKey = '([^']+)'/);

    if (!urlMatch || !keyMatch) {
      return null;
    }

    return {
      url: urlMatch[1],
      anonKey: keyMatch[1],
    };
  } catch (error) {
    console.warn('[prerender] Unable to read Supabase config:', error);
    return null;
  }
}

async function fetchProductPages() {
  const config = await readSupabaseConfig();

  if (!config) {
    return [];
  }

  try {
    const endpoint =
      `${config.url}/rest/v1/products` +
      '?select=id,product_code,name,category,price,stock,description,short_description,image_url,created_at' +
      '&product_type=eq.basic' +
      '&order=created_at.desc';

    const response = await fetch(endpoint, {
      headers: {
        apikey: config.anonKey,
        Authorization: `Bearer ${config.anonKey}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Supabase responded with ${response.status}`);
    }

    const products = await response.json();

    return Array.isArray(products) ? products : [];
  } catch (error) {
    console.warn('[prerender] Product fetch failed, continuing without product detail prerender:', error);
    return [];
  }
}

function buildProductDescription(product) {
  const rawDescription =
    product.short_description ||
    stripHtml(product.description) ||
    `${product.name} 렌탈 서비스입니다. 행사어때에서 대전 MICE 행사에 필요한 상품을 확인해보세요.`;

  return truncate(rawDescription, 160);
}

function buildProductSchemas(product, canonicalUrl, imageUrl, description) {
  return [
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      itemListElement: [
        {
          '@type': 'ListItem',
          position: 1,
          name: '홈',
          item: SITE_URL,
        },
        {
          '@type': 'ListItem',
          position: 2,
          name: '상품',
          item: `${SITE_URL}/products`,
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: product.name,
          item: canonicalUrl,
        },
      ],
    },
    {
      '@context': 'https://schema.org',
      '@type': 'Product',
      name: product.name,
      image: [imageUrl],
      description,
      sku: product.product_code || product.id,
      category: product.category || undefined,
      brand: {
        '@type': 'Brand',
        name: SITE_NAME,
      },
      offers: {
        '@type': 'Offer',
        priceCurrency: 'KRW',
        price: String(product.price || 0),
        availability:
          product.stock === 0 ? 'https://schema.org/OutOfStock' : 'https://schema.org/InStock',
        url: canonicalUrl,
        itemCondition: 'https://schema.org/NewCondition',
      },
    },
  ];
}

async function main() {
  const baseHtml = await readFile(path.join(DIST_DIR, 'index.html'), 'utf8');

  // Let Firebase Hosting serve /sitemap.xml via the Cloud Function rewrite.
  await rm(path.join(DIST_DIR, 'sitemap.xml'), { force: true });

  for (const route of staticRoutes) {
    const html = renderHtml(baseHtml, route);
    await writeRouteHtml(route.route, html);
  }

  const products = await fetchProductPages();

  for (const product of products) {
    if (!product?.id || !product?.name) {
      continue;
    }

    const canonicalPath = `/products/${product.id}`;
    const canonicalUrl = absoluteUrl(canonicalPath);
    const imageUrl = absoluteUrl(product.image_url || DEFAULT_OG_IMAGE);
    const description = buildProductDescription(product);

    const html = renderHtml(baseHtml, {
      title: `${product.name} | 행사어때`,
      description,
      canonical: canonicalPath,
      robots: INDEX_ROBOTS,
      image: imageUrl,
      type: 'product',
      jsonLd: buildProductSchemas(product, canonicalUrl, imageUrl, description),
    });

    await writeRouteHtml(canonicalPath, html);
  }

  console.log(
    `[prerender] Generated ${staticRoutes.length} static route HTML files and ${products.length} product detail HTML files.`
  );
}

main().catch((error) => {
  console.error('[prerender] Build failed:', error);
  process.exit(1);
});
