import React from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Seo } from '../components/seo/Seo';
import { Container } from '../components/ui/Container';

interface ContentDetailPageProps {
  listPath: string;
  listLabel: string;
  canonicalPath: string;
  title: string;
  dateText?: string | null;
  imageUrl?: string | null;
  contentHtml?: string | null;
  description?: string;
}

const CONTENT_IMAGE_CLASS =
  '[&_img]:mx-auto [&_img]:my-8 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg';

const CONTENT_TABLE_CLASS =
  '[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg';

const CONTENT_CELL_CLASS =
  '[&_td]:border [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-3 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left';

export const ContentDetailPage: React.FC<ContentDetailPageProps> = ({
  listPath,
  listLabel,
  canonicalPath,
  title,
  dateText,
  imageUrl,
  contentHtml,
  description,
}) => {
  const seoDescription = description?.trim() || `${title} 상세 페이지입니다.`;

  return (
    <>
      <Seo
        title={`${title} | 행사어때`}
        description={seoDescription}
        canonical={canonicalPath}
        image={imageUrl || undefined}
      />

      <div className="min-h-screen bg-white pb-20">
        <Container className="max-w-[1280px]">
          <div className="py-10 md:py-14">
            <Link
              to={listPath}
              className="inline-flex items-center gap-2 text-sm font-medium text-slate-400 transition-colors hover:text-slate-700"
            >
              <ArrowLeft size={16} />
              {listLabel} 목록으로
            </Link>

            <div className="mt-8 border-b border-slate-200 pb-8">
              <h1 className="break-keep text-[30px] font-bold leading-tight text-slate-900 md:text-[42px]">
                {title}
              </h1>
              {dateText ? <p className="mt-5 text-sm text-slate-400">{dateText}</p> : null}
            </div>

            <div className="pt-8 md:pt-10">
              {imageUrl ? (
                <div className="overflow-hidden bg-slate-100">
                  <img
                    src={imageUrl}
                    alt={title}
                    className="h-auto w-full object-cover"
                    decoding="async"
                  />
                </div>
              ) : null}

              {contentHtml?.trim() ? (
                <div
                  className={`prose prose-slate mt-8 max-w-none break-keep text-[15px] leading-8 text-slate-700 md:mt-10 md:text-[16px] ${CONTENT_IMAGE_CLASS} ${CONTENT_TABLE_CLASS} ${CONTENT_CELL_CLASS} [&_a]:text-[#39B54A] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:pl-4 [&_hr]:my-10 [&_li]:my-1 [&_ol]:pl-5 [&_p]:my-4 [&_strong]:text-slate-900 [&_ul]:pl-5`}
                  dangerouslySetInnerHTML={{ __html: contentHtml }}
                />
              ) : (
                <div className="mt-8 rounded-[18px] border border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 md:mt-10">
                  등록된 상세 내용이 없습니다.
                </div>
              )}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
};
