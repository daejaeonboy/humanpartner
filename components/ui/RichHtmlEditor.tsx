import React, { useEffect, useRef, useState } from 'react';
import { Bold, Image as ImageIcon, Italic, Loader2, Underline } from 'lucide-react';
import { uploadImage } from '../../src/api/storageApi';

interface RichHtmlEditorProps {
  initialValue: string;
  onChange: (value: string) => void;
  placeholder?: string;
  imageFolder?: string;
  className?: string;
  minHeightClassName?: string;
}

export const RichHtmlEditor: React.FC<RichHtmlEditorProps> = ({
  initialValue,
  onChange,
  placeholder = '내용을 입력하세요.',
  imageFolder = 'description-images',
  className = '',
  minHeightClassName = 'min-h-[220px]',
}) => {
  const contentRef = useRef<HTMLDivElement>(null);
  const [uploading, setUploading] = useState(false);
  const [htmlValue, setHtmlValue] = useState(initialValue);

  useEffect(() => {
    if (!contentRef.current) return;

    if (contentRef.current.innerHTML !== initialValue) {
      contentRef.current.innerHTML = initialValue || '';
    }
    setHtmlValue(initialValue || '');
  }, [initialValue]);

  const handleInput = () => {
    const nextValue = contentRef.current?.innerHTML || '';
    setHtmlValue(nextValue);
    onChange(nextValue);
  };

  const execCmd = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    handleInput();
    contentRef.current?.focus();
  };

  const handleImageInsert = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      setUploading(true);
      try {
        const url = await uploadImage(file, imageFolder);
        execCmd(
          'insertHTML',
          `<p><img src="${url}" alt="" style="max-width:100%;height:auto;" /></p>`,
        );
      } catch (error) {
        console.error('Failed to upload editor image:', error);
        alert('본문 이미지 업로드에 실패했습니다.');
      } finally {
        setUploading(false);
      }
    };
    input.click();
  };

  const isEmpty =
    !htmlValue ||
    htmlValue === '<br>' ||
    htmlValue === '<div><br></div>' ||
    htmlValue === '<p><br></p>';

  return (
    <div className={`overflow-hidden rounded-lg border border-slate-200 bg-white ${className}`}>
      <div className="flex items-center gap-1 border-b border-slate-200 bg-slate-50 px-2 py-2">
        <button
          type="button"
          onClick={() => execCmd('bold')}
          className="rounded p-2 text-slate-700 transition-colors hover:bg-slate-200"
          title="굵게"
        >
          <Bold size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCmd('italic')}
          className="rounded p-2 text-slate-700 transition-colors hover:bg-slate-200"
          title="기울임"
        >
          <Italic size={16} />
        </button>
        <button
          type="button"
          onClick={() => execCmd('underline')}
          className="rounded p-2 text-slate-700 transition-colors hover:bg-slate-200"
          title="밑줄"
        >
          <Underline size={16} />
        </button>
        <div className="mx-1 h-5 w-px bg-slate-300" />
        <button
          type="button"
          onClick={handleImageInsert}
          disabled={uploading}
          className="flex items-center gap-1 rounded p-2 text-slate-700 transition-colors hover:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
          title="이미지 삽입"
        >
          {uploading ? <Loader2 size={16} className="animate-spin" /> : <ImageIcon size={16} />}
          <span className="text-xs font-medium">이미지</span>
        </button>
      </div>

      <div className={`relative bg-white ${minHeightClassName}`}>
        {isEmpty && (
          <div className="pointer-events-none absolute left-4 top-4 text-sm text-slate-400">
            {placeholder}
          </div>
        )}
        <div
          ref={contentRef}
          className={`prose prose-sm max-w-none p-4 outline-none [&_img]:max-w-full [&_img]:h-auto ${minHeightClassName}`}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
        />
      </div>
    </div>
  );
};
