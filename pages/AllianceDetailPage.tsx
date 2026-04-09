import React from 'react';
import { Loader2, MapPin, Phone } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { ContentDetailPage } from './ContentDetailPage';
import { NotFound } from './NotFound';
import {
  AllianceMember,
  deleteAllianceMember,
  getAllianceCategoryNames,
  getAllAllianceCategories,
  getAllianceMemberById,
  updateAllianceMember,
} from '../src/api/cmsApi';
import { useAuth } from '../src/context/AuthContext';
import { DetailAdminMenu } from '../components/content/DetailAdminMenu';
import { AllianceInlineEditor } from '../components/content/InlineDetailEditors';

const buildDescription = (member: AllianceMember) => {
  const plainText = (member.content || '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return plainText || `${member.name} 회원사 상세 페이지입니다.`;
};

export const AllianceDetailPage: React.FC = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { isAdmin } = useAuth();
  const [member, setMember] = React.useState<AllianceMember | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [notFound, setNotFound] = React.useState(false);
  const [editing, setEditing] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [categoryOptions, setCategoryOptions] = React.useState<string[]>([]);

  const fetchMember = React.useCallback(async () => {
    if (!id) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    setLoading(true);
    setNotFound(false);

    try {
      const data = await getAllianceMemberById(id);
      if (!data) {
        setMember(null);
        setNotFound(true);
        return;
      }

      setMember(data);
    } catch (error) {
      console.error('Failed to load alliance member detail:', error);
      setMember(null);
      setNotFound(true);
    } finally {
      setLoading(false);
    }
  }, [id]);

  React.useEffect(() => {
    void fetchMember();
  }, [fetchMember]);

  React.useEffect(() => {
    if (!isAdmin) return;

    const loadCategories = async () => {
      try {
        const categories = await getAllAllianceCategories();
        setCategoryOptions(getAllianceCategoryNames(categories, []));
      } catch (error) {
        console.error('Failed to load alliance categories:', error);
      }
    };

    void loadCategories();
  }, [isAdmin]);

  const handleSave = async (updates: Partial<AllianceMember>) => {
    if (!member?.id) return;

    setSaving(true);
    try {
      await updateAllianceMember(member.id, updates);

      if (updates.is_active === false) {
        navigate('/alliance');
        return;
      }

      await fetchMember();
      setEditing(false);
    } catch (error: any) {
      console.error('Failed to update alliance member:', error);
      alert(`협력업체 수정에 실패했습니다.\n\n오류 내용: ${error?.message || '알 수 없는 오류'}`);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!member?.id) return;
    if (!confirm('이 협력업체를 삭제하시겠습니까?')) return;

    setDeleting(true);
    try {
      await deleteAllianceMember(member.id);
      navigate('/alliance');
    } catch (error: any) {
      console.error('Failed to delete alliance member:', error);
      alert(`협력업체 삭제에 실패했습니다.\n\n오류 내용: ${error?.message || '알 수 없는 오류'}`);
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

  if (notFound || !member) {
    return <NotFound />;
  }

  return (
    <ContentDetailPage
      listPath="/alliance"
      listLabel="회원사"
      canonicalPath={`/alliance/${member.id}`}
      title={member.name}
      imageUrl={member.logo_url}
      contentHtml={member.content}
      description={buildDescription(member)}
      imageWrapperClassName="overflow-hidden bg-slate-100 px-6 py-12 md:px-10 md:py-14"
      imageClassName="mx-auto h-auto max-h-[420px] w-full max-w-[72%] object-contain md:max-w-[60%]"
      contentTop={
        member.address || member.phone ? (
          <div className="grid gap-5 border-y border-slate-200 py-6 md:grid-cols-2 md:gap-8 md:py-7">
            {member.address ? (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-400">주소</p>
                <div className="mt-2 flex items-start gap-2 text-[15px] leading-[1.8] text-slate-700 md:text-[16px]">
                  <MapPin className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="break-keep">{member.address}</p>
                </div>
              </div>
            ) : null}
            {member.phone ? (
              <div className="min-w-0">
                <p className="text-[13px] font-semibold text-slate-400">전화번호</p>
                <div className="mt-2 flex items-start gap-2 text-[15px] leading-[1.8] text-slate-700 md:text-[16px]">
                  <Phone className="mt-1 h-4 w-4 shrink-0 text-slate-400" />
                  <p className="break-keep">{member.phone}</p>
                </div>
              </div>
            ) : null}
          </div>
        ) : undefined
      }
      showEmptyContentState={false}
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
          <AllianceInlineEditor
            item={member}
            categoryOptions={categoryOptions}
            saving={saving}
            onCancel={() => setEditing(false)}
            onSubmit={handleSave}
          />
        ) : undefined
      }
    />
  );
};
