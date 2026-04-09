import React from 'react';
import { Loader2, Save, Upload, X } from 'lucide-react';
import { RichHtmlEditor } from '../ui/RichHtmlEditor';
import { uploadImage } from '../../src/api/storageApi';
import type { InstallationCase, Notice } from '../../src/api/contentApi';
import { normalizeContentCategoryName } from '../../src/api/contentApi';
import type { AllianceMember } from '../../src/api/cmsApi';
import { normalizeAllianceCategoryName } from '../../src/api/cmsApi';

type ContentEditorFormState = {
  category: string;
  title: string;
  published_at: string;
  image_url: string;
  content: string;
  display_order: number;
  is_active: boolean;
};

type AllianceEditorFormState = {
  name: string;
  category1: string;
  category2: string;
  address: string;
  phone: string;
  logo_url: string;
  content: string;
  display_order: number;
  is_active: boolean;
};

interface EditorShellProps {
  title: string;
  saving: boolean;
  onCancel: () => void;
  onSubmit: (event: React.FormEvent) => void;
  children: React.ReactNode;
}

interface InlineImageFieldProps {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  uploadFolder: string;
  previewAlt: string;
  previewClassName: string;
  uploadPlaceholder: string;
  helperText?: string;
}

interface ContentInlineEditorProps {
  item: Notice | InstallationCase;
  itemLabel: string;
  categoryOptions: string[];
  defaultCategory: string;
  uploadFolder: 'notices' | 'installation-cases';
  saving: boolean;
  onCancel: () => void;
  onSubmit: (updates: Partial<Notice | InstallationCase>) => void | Promise<void>;
}

interface AllianceInlineEditorProps {
  item: AllianceMember;
  categoryOptions: string[];
  saving: boolean;
  onCancel: () => void;
  onSubmit: (updates: Partial<AllianceMember>) => void | Promise<void>;
}

const formatDateTimeInput = (value?: string | null) => {
  if (!value) return '';

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return String(value).slice(0, 16);
  }

  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
};

const EditorShell: React.FC<EditorShellProps> = ({ title, saving, onCancel, onSubmit, children }) => (
  <div className="bg-white">
    <div className="border-b border-slate-100 py-5">
      <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      <p className="mt-1 text-sm text-slate-500">이 페이지 안에서 바로 수정할 수 있습니다.</p>
    </div>

    <form onSubmit={onSubmit} className="space-y-5 py-6">
      {children}

      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-lg border border-slate-200 px-5 py-3.5 font-semibold text-slate-600 transition-colors hover:bg-slate-50"
        >
          취소
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex flex-[1.5] items-center justify-center gap-2 rounded-lg bg-[#39B54A] px-5 py-3.5 font-semibold text-white transition-colors hover:bg-[#2F9A3F] disabled:cursor-not-allowed disabled:bg-slate-300"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          저장하기
        </button>
      </div>
    </form>
  </div>
);

const InlineImageField: React.FC<InlineImageFieldProps> = ({
  label,
  value,
  onChange,
  uploadFolder,
  previewAlt,
  previewClassName,
  uploadPlaceholder,
  helperText,
}) => {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = React.useState(false);

  const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드할 수 있습니다.');
      return;
    }

    setUploading(true);
    try {
      const imageUrl = await uploadImage(file, uploadFolder);
      onChange(imageUrl);
    } catch (error) {
      console.error('Inline image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <label className="mb-2 ml-1 block text-sm font-bold text-slate-700">{label}</label>
      <input ref={fileInputRef} type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />

      {value ? (
        <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-4">
          <img src={value} alt={previewAlt} className={previewClassName} decoding="async" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute right-6 top-6 rounded-full bg-black/70 p-2 text-white transition-colors hover:bg-black"
            aria-label="이미지 제거"
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="flex h-36 w-full flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed border-slate-300 bg-slate-50 transition-colors hover:border-[#39B54A] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <Loader2 className="animate-spin text-[#39B54A]" size={22} />
          ) : (
            <>
              <Upload size={22} className="text-slate-400" />
              <span className="text-sm font-medium text-slate-500">{uploadPlaceholder}</span>
            </>
          )}
        </button>
      )}

      {helperText ? <p className="mt-2 text-xs text-slate-500">{helperText}</p> : null}
    </div>
  );
};

export const ContentInlineEditor: React.FC<ContentInlineEditorProps> = ({
  item,
  itemLabel,
  categoryOptions,
  defaultCategory,
  uploadFolder,
  saving,
  onCancel,
  onSubmit,
}) => {
  const [formData, setFormData] = React.useState<ContentEditorFormState>({
    category: normalizeContentCategoryName(item.category) || categoryOptions[0] || defaultCategory,
    title: item.title || '',
    published_at: formatDateTimeInput(item.published_at),
    image_url: item.image_url || '',
    content: item.content || '',
    display_order: item.display_order || 1,
    is_active: item.is_active,
  });

  React.useEffect(() => {
    setFormData({
      category: normalizeContentCategoryName(item.category) || categoryOptions[0] || defaultCategory,
      title: item.title || '',
      published_at: formatDateTimeInput(item.published_at),
      image_url: item.image_url || '',
      content: item.content || '',
      display_order: item.display_order || 1,
      is_active: item.is_active,
    });
  }, [categoryOptions, defaultCategory, item]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSubmit({
      category: normalizeContentCategoryName(formData.category) || defaultCategory,
      title: formData.title,
      published_at: formData.published_at || null,
      image_url: formData.image_url || '',
      content: formData.content,
      display_order: formData.display_order,
      is_active: formData.is_active,
    });
  };

  return (
    <EditorShell title={`${itemLabel} 수정`} saving={saving} onCancel={onCancel} onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">카테고리</label>
          <select
            value={formData.category}
            onChange={(event) => setFormData((prev) => ({ ...prev, category: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
          >
            {(categoryOptions.length > 0 ? categoryOptions : [defaultCategory]).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">노출 순서</label>
          <input
            type="number"
            min="1"
            value={formData.display_order}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                display_order: parseInt(event.target.value, 10) || 1,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">제목</label>
          <input
            type="text"
            value={formData.title}
            onChange={(event) => setFormData((prev) => ({ ...prev, title: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            placeholder={`${itemLabel} 제목`}
            required
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">게시일</label>
          <input
            type="datetime-local"
            value={formData.published_at}
            onChange={(event) => setFormData((prev) => ({ ...prev, published_at: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
          />
        </div>
      </div>

      <InlineImageField
        label="대표 이미지"
        value={formData.image_url}
        onChange={(value) => setFormData((prev) => ({ ...prev, image_url: value }))}
        uploadFolder={uploadFolder}
        previewAlt={`${itemLabel} 대표 이미지`}
        previewClassName="h-48 w-full rounded-lg object-cover"
        uploadPlaceholder="이미지 업로드"
      />

      <div>
        <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">본문</label>
        <RichHtmlEditor
          initialValue={formData.content || ''}
          onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
          placeholder="상세 내용과 본문 이미지를 입력하세요."
          imageFolder={uploadFolder}
          minHeightClassName="min-h-[360px] md:min-h-[420px]"
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-[#39B54A] focus:ring-[#39B54A]"
        />
        <span className="text-sm font-medium text-slate-700">페이지에 노출하기</span>
      </label>
    </EditorShell>
  );
};

export const AllianceInlineEditor: React.FC<AllianceInlineEditorProps> = ({
  item,
  categoryOptions,
  saving,
  onCancel,
  onSubmit,
}) => {
  const [formData, setFormData] = React.useState<AllianceEditorFormState>({
    name: item.name || '',
    category1: normalizeAllianceCategoryName(item.category1) || categoryOptions[0] || 'MICE 시설분과',
    category2: item.category2 || '',
    address: item.address || '',
    phone: item.phone || '',
    logo_url: item.logo_url || '',
    content: item.content || '',
    display_order: item.display_order || 1,
    is_active: item.is_active,
  });

  React.useEffect(() => {
    setFormData({
      name: item.name || '',
      category1: normalizeAllianceCategoryName(item.category1) || categoryOptions[0] || 'MICE 시설분과',
      category2: item.category2 || '',
      address: item.address || '',
      phone: item.phone || '',
      logo_url: item.logo_url || '',
      content: item.content || '',
      display_order: item.display_order || 1,
      is_active: item.is_active,
    });
  }, [categoryOptions, item]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void onSubmit({
      name: formData.name,
      category1: normalizeAllianceCategoryName(formData.category1) || 'MICE 시설분과',
      category2: formData.category2,
      address: formData.address,
      phone: formData.phone,
      logo_url: formData.logo_url,
      content: formData.content,
      display_order: formData.display_order,
      is_active: formData.is_active,
    });
  };

  return (
    <EditorShell title="협력업체 수정" saving={saving} onCancel={onCancel} onSubmit={handleSubmit}>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">회원사명</label>
          <input
            type="text"
            value={formData.name}
            onChange={(event) => setFormData((prev) => ({ ...prev, name: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            placeholder="회원사명 입력"
            required
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">표시 순서</label>
          <input
            type="number"
            min="1"
            value={formData.display_order}
            onChange={(event) =>
              setFormData((prev) => ({
                ...prev,
                display_order: parseInt(event.target.value, 10) || 1,
              }))
            }
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">1차 분과</label>
          <select
            value={formData.category1}
            onChange={(event) => setFormData((prev) => ({ ...prev, category1: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
          >
            {(categoryOptions.length > 0 ? categoryOptions : ['MICE 시설분과']).map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">업종</label>
          <input
            type="text"
            value={formData.category2}
            onChange={(event) => setFormData((prev) => ({ ...prev, category2: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            placeholder="예: 호텔, 컨벤션센터"
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">주소</label>
          <input
            type="text"
            value={formData.address}
            onChange={(event) => setFormData((prev) => ({ ...prev, address: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            placeholder="주소 입력"
          />
        </div>
        <div>
          <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">전화번호</label>
          <input
            type="text"
            value={formData.phone}
            onChange={(event) => setFormData((prev) => ({ ...prev, phone: event.target.value }))}
            className="w-full rounded-lg border border-slate-200 bg-slate-50/50 px-4 py-3 outline-none transition-all focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
            placeholder="042-000-0000"
          />
        </div>
      </div>

      <InlineImageField
        label="로고 이미지"
        value={formData.logo_url}
        onChange={(value) => setFormData((prev) => ({ ...prev, logo_url: value }))}
        uploadFolder="alliance-logos"
        previewAlt={`${item.name} 로고`}
        previewClassName="mx-auto h-32 w-full object-contain"
        uploadPlaceholder="로고 이미지 업로드"
        helperText="배경이 투명하거나 흰색인 로고 이미지를 권장합니다."
      />

      <div>
        <label className="mb-1.5 ml-1 block text-sm font-bold text-slate-700">본문 내용</label>
        <RichHtmlEditor
          initialValue={formData.content || ''}
          onChange={(value) => setFormData((prev) => ({ ...prev, content: value }))}
          placeholder="회원사 상세페이지에 노출할 본문 내용을 입력하세요."
          imageFolder="description-images"
          minHeightClassName="min-h-[360px] md:min-h-[420px]"
        />
      </div>

      <label className="flex items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 px-4 py-3">
        <input
          type="checkbox"
          checked={formData.is_active}
          onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
          className="h-4 w-4 rounded border-slate-300 text-[#39B54A] focus:ring-[#39B54A]"
        />
        <span className="text-sm font-medium text-slate-700">페이지에 노출하기</span>
      </label>
    </EditorShell>
  );
};
