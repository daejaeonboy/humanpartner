import React from 'react';
import { ExternalLink } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { NOINDEX_ROBOTS } from '../src/seo';

const COMPANY_HOME_URL = 'https://micepartner.co.kr/';

export const CompanyIntro: React.FC = () => {
  React.useEffect(() => {
    window.location.replace(COMPANY_HOME_URL);
  }, []);

  return (
    <div className="flex min-h-[60vh] items-center justify-center bg-white px-6 py-16">
      <Seo
        title="회사소개 | 행사어때"
        description="행사어때 회사소개는 공식 홈페이지에서 확인할 수 있습니다."
        canonical={COMPANY_HOME_URL}
        robots={NOINDEX_ROBOTS}
      />

      <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm">
        <p className="text-sm font-semibold tracking-[0.18em] text-[#39B54A]">OFFICIAL WEBSITE</p>
        <h1 className="mt-4 text-3xl font-bold text-slate-900">공식 홈페이지로 이동 중입니다</h1>
        <p className="mt-4 break-keep text-[15px] leading-7 text-slate-600">
          회사소개는 행사어때 공식 홈페이지에서 확인하실 수 있습니다.
        </p>
        <a
          href={COMPANY_HOME_URL}
          className="mt-8 inline-flex items-center justify-center gap-2 rounded-lg bg-[#39B54A] px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-[#2e933c]"
        >
          공식 홈페이지 바로가기
          <ExternalLink size={16} />
        </a>
      </div>
    </div>
  );
};
