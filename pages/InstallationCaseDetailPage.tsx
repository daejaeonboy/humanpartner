import React from 'react';
import { useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ContentDetailPage } from './ContentDetailPage';
import { NotFound } from './NotFound';
import { getInstallationCaseById, InstallationCase } from '../src/api/contentApi';

const formatDate = (value?: string | null) => {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('ko-KR');
};

const buildDescription = (item: InstallationCase) => {
  const plainText = (item.summary || item.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText || `${item.title} 설치사례 상세 페이지입니다.`;
};

export const InstallationCaseDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [item, setItem] = React.useState<InstallationCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);

  React.useEffect(() => {
    const fetchItem = async () => {
      if (!id) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setLoading(true);
      setNotFound(false);

      try {
        const data = await getInstallationCaseById(id);
        if (!data) {
          setItem(null);
          setNotFound(true);
          return;
        }

        setItem(data);
      } catch (error) {
        console.error('Failed to load installation case detail:', error);
        setItem(null);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    void fetchItem();
  }, [id]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="animate-spin text-[#39B54A]" size={36} />
      </div>
    );
  }

  if (notFound || !item) {
    return <NotFound />;
  }

  return (
    <ContentDetailPage
      listPath="/cases"
      listLabel="설치사례"
      canonicalPath={`/cases/${item.id}`}
      title={item.title}
      dateText={formatDate(item.published_at)}
      imageUrl={item.image_url}
      contentHtml={item.content}
      description={buildDescription(item)}
    />
  );
};
