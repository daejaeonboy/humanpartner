export const SITE_URL = 'https://miceday.co.kr';
export const SITE_NAME = '행사어때';
export const SITE_TITLE = '행사어때 | 대전 MICE 행사 통합운영 플랫폼';
export const SITE_DESCRIPTION =
  '행사어때는 대전·충청권 MICE 행사에 필요한 기획, 장비 렌탈, 공간 연출, 운영 지원을 한 번에 제공하는 행사 통합운영 플랫폼입니다.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/logo_card.jpg`;
export const INDEX_ROBOTS =
  'index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1';
export const NOINDEX_ROBOTS = 'noindex,follow';

export const ORGANIZATION = {
  legalName: SITE_NAME,
  alternateName: SITE_NAME,
  representative: '이기섭',
  businessNumber: '305-30-85537',
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

export const absoluteUrl = (pathOrUrl: string) => {
  if (!pathOrUrl) return SITE_URL;
  if (/^https?:\/\//i.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? pathOrUrl : `/${pathOrUrl}`}`;
};

export const serializeJsonLd = (value: unknown) =>
  JSON.stringify(value).replace(/</g, '\\u003c');
