import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ContentDetailPage } from './ContentDetailPage';
import { NotFound } from './NotFound';
import {
  deleteInstallationCase,
  getInstallationCaseById,
  getInstallationCaseCategories,
  getInstallationCaseCategoryNames,
  InstallationCase,
  updateInstallationCase,
} from '../src/api/contentApi';
import { useAuth } from '../src/context/AuthContext';
import { DetailAdminMenu } from '../components/content/DetailAdminMenu';
import { ContentInlineEditor } from '../components/content/InlineDetailEditors';

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
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [item, setItem] = React.useState<InstallationCase | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>([]);

  const fetchItem = React.useCallback(async () => {
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
  }, [id]);

  React.useEffect(() => {
    void fetchItem();
  }, [fetchItem]);

  React.useEffect(() => {
    if (!isAdmin) return;

    const loadCategories = async () => {
      try {
        const categories = await getInstallationCaseCategories();
        setCategoryOptions(getInstallationCaseCategoryNames(categories, []));
      } catch (error) {
        console.error('Failed to load installation case categories:', error);
      }
    };

    void loadCategories();
  }, [isAdmin]);

  const handleSave = async (updates: Partial<InstallationCase>) => {
    if (!item?.id) return;

    setSaving(true);
    try {
      await updateInstallationCase(item.id, updates);

      if (updates.is_active === false) {
        navigate('/cases');
        return;
      }

      await fetchItem();
      setEditing(false);
    } catch (error: any) {
      console.error('Failed to update installation case:', error);
      alert(`설치사례 수정에 실패했습니다.\n\n오류 내용: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!item?.id) return;
    if (!confirm('이 설치사례를 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      await deleteInstallationCase(item.id);
      navigate('/cases');
    } catch (error: any) {
      console.error('Failed to delete installation case:', error);
      alert(`설치사례 삭제에 실패했습니다.\n\n오류 내용: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setDeleting(false);
    }
  };

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
      headerActions={
        isAdmin ? (
          <DetailAdminMenu
            editing={editing}
            deleting={deleting}
            onEdit={() => setEditing((prev) => !prev)}
            onDelete={handleDelete}
          />
        ) : undefined
      }
      editorPanel={
        isAdmin && editing ? (
          <ContentInlineEditor
            item={item}
            itemLabel="설치사례"
            categoryOptions={categoryOptions}
            defaultCategory="일반"
            uploadFolder="installation-cases"
            saving={saving}
            onCancel={() => setEditing(false)}
            onSubmit={handleSave}
          />
        ) : undefined
      }
    />
  );
};
