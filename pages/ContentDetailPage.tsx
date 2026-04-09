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
  imageWrapperClassName?: string;
  imageClassName?: string;
  showEmptyContentState?: boolean;
  headerActions?: React.ReactNode;
  editorPanel?: React.ReactNode;
  contentTop?: React.ReactNode;
}

const CONTENT_IMAGE_CLASS =
  '[&_img]:mx-auto [&_img]:my-8 [&_img]:block [&_img]:aspect-video [&_img]:w-full [&_img]:!rounded-none [&_img]:bg-slate-100 [&_img]:object-cover';

const CONTENT_TABLE_CLASS =
  '[&_table]:my-8 [&_table]:w-full [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg';

const CONTENT_CELL_CLASS =
  '[&_td]:border [&_td]:border-slate-200 [&_td]:px-4 [&_td]:py-3 [&_th]:border [&_th]:border-slate-200 [&_th]:bg-slate-50 [&_th]:px-4 [&_th]:py-3 [&_th]:text-left';

const URL_PATTERN = /https?:\/\/[^\s<]+/g;
const SKIP_LINKIFY_TAGS = new Set(['A', 'SCRIPT', 'STYLE', 'CODE', 'PRE', 'TEXTAREA']);

const splitTrailingPunctuation = (rawUrl: string) => {
  let url = rawUrl;
  let trailing = '';

  while (url && /[),.!?;:'"\]]$/.test(url)) {
    trailing = `${url.slice(-1)}${trailing}`;
    url = url.slice(0, -1);
  }

  return { url, trailing };
};

const linkifyHtmlContent = (html: string) => {
  if (!html?.trim() || typeof window === 'undefined' || typeof DOMParser === 'undefined') {
    return html;
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(`<div>${html}</div>`, 'text/html');
  const root = doc.body.firstElementChild;

  if (!root) return html;

  const walker = doc.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const textNodes: Text[] = [];
  let currentNode = walker.nextNode();

  while (currentNode) {
    const textNode = currentNode as Text;
    const parent = textNode.parentElement;
    const textValue = textNode.nodeValue || '';

    if (parent && !SKIP_LINKIFY_TAGS.has(parent.tagName) && URL_PATTERN.test(textValue)) {
      textNodes.push(textNode);
    }

    URL_PATTERN.lastIndex = 0;
    currentNode = walker.nextNode();
  }

  textNodes.forEach((textNode) => {
    const textValue = textNode.nodeValue || '';
    const fragment = doc.createDocumentFragment();
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = URL_PATTERN.exec(textValue)) !== null) {
      const [rawUrl] = match;
      const startIndex = match.index;
      const endIndex = startIndex + rawUrl.length;
      const { url, trailing } = splitTrailingPunctuation(rawUrl);

      if (startIndex > lastIndex) {
        fragment.appendChild(doc.createTextNode(textValue.slice(lastIndex, startIndex)));
      }

      if (url) {
        const anchor = doc.createElement('a');
        anchor.href = url;
        anchor.textContent = url;
        anchor.target = '_blank';
        anchor.rel = 'noopener noreferrer';
        fragment.appendChild(anchor);
      } else {
        fragment.appendChild(doc.createTextNode(rawUrl));
      }

      if (trailing) {
        fragment.appendChild(doc.createTextNode(trailing));
      }

      lastIndex = endIndex;
    }

    if (lastIndex < textValue.length) {
      fragment.appendChild(doc.createTextNode(textValue.slice(lastIndex)));
    }

    textNode.parentNode?.replaceChild(fragment, textNode);
    URL_PATTERN.lastIndex = 0;
  });

  return root.innerHTML;
};

export const ContentDetailPage: React.FC<ContentDetailPageProps> = ({
  listPath,
  listLabel,
  canonicalPath,
  title,
  dateText,
  imageUrl,
  contentHtml,
  description,
  imageWrapperClassName,
  imageClassName,
  showEmptyContentState = true,
  headerActions,
  editorPanel,
  contentTop,
}) => {
  const seoDescription = description?.trim() || `${title} 상세 페이지입니다.`;
  const renderedContentHtml = contentHtml ? linkifyHtmlContent(contentHtml) : contentHtml;

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

            <div className="mt-8 flex items-start justify-between gap-4 border-b border-slate-200 pb-8">
              <div className="min-w-0 flex-1">
                <h1 className="break-keep text-[30px] font-bold leading-tight text-slate-900 md:text-[42px]">
                  {title}
                </h1>
                {dateText ? <p className="mt-5 text-sm text-slate-400">{dateText}</p> : null}
              </div>
              {headerActions ? <div className="shrink-0">{headerActions}</div> : null}
            </div>

            <div className="pt-8 md:pt-10">
              {editorPanel ? <div className="mb-8 md:mb-10">{editorPanel}</div> : null}
              {!editorPanel && imageUrl ? (
                <div className={imageWrapperClassName || 'aspect-video overflow-hidden bg-slate-100'}>
                  <img
                    src={imageUrl}
                    alt={title}
                    className={imageClassName || 'h-full w-full object-cover'}
                    decoding="async"
                  />
                </div>
              ) : null}
              {!editorPanel && contentTop ? <div className="mt-8 md:mt-10">{contentTop}</div> : null}

              {!editorPanel && renderedContentHtml?.trim() ? (
                <div
                  className={`prose prose-slate mt-8 max-w-none break-normal text-[15px] leading-[1.8] text-slate-700 md:mt-10 md:break-keep md:text-[16px] ${CONTENT_IMAGE_CLASS} ${CONTENT_TABLE_CLASS} ${CONTENT_CELL_CLASS} [&_a]:text-[#39B54A] [&_a]:underline [&_blockquote]:border-l-4 [&_blockquote]:border-slate-200 [&_blockquote]:leading-[1.8] [&_blockquote]:pl-4 [&_hr]:my-10 [&_li]:my-1 [&_li]:leading-[1.8] [&_ol]:pl-5 [&_p]:my-4 [&_p]:leading-[1.8] [&_strong]:text-slate-900 [&_ul]:pl-5`}
                  dangerouslySetInnerHTML={{ __html: renderedContentHtml }}
                />
              ) : !editorPanel && showEmptyContentState ? (
                <div className="mt-8 rounded-[18px] border border-slate-200 bg-slate-50 px-6 py-8 text-sm text-slate-500 md:mt-10">
                  등록된 상세 내용이 없습니다.
                </div>
              ) : null}
            </div>
          </div>
        </Container>
      </div>
    </>
  );
};
