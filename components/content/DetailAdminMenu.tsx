import React from 'react';
import { Edit2, Loader2, MoreVertical, Trash2 } from 'lucide-react';

interface DetailAdminMenuProps {
  editing: boolean;
  deleting?: boolean;
  onEdit: () => void;
  onDelete: () => void;
}

export const DetailAdminMenu: React.FC<DetailAdminMenuProps> = ({
  editing,
  deleting = false,
  onEdit,
  onDelete,
}) => {
  const [open, setOpen] = React.useState(false);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  return (
    <div ref={menuRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-white text-slate-500 transition-all hover:bg-slate-50 hover:text-slate-700"
        aria-label="관리 메뉴 열기"
      >
        <MoreVertical size={18} />
      </button>

      {open ? (
        <div className="absolute right-0 top-[calc(100%+10px)] z-20 min-w-[160px] overflow-hidden rounded-2xl border border-slate-200 bg-white py-2 shadow-xl">
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEdit();
            }}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-slate-700 transition-colors hover:bg-slate-50"
          >
            <Edit2 size={16} />
            {editing ? '수정 닫기' : '수정'}
          </button>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onDelete();
            }}
            disabled={deleting}
            className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-medium text-red-500 transition-colors hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
            삭제
          </button>
        </div>
      ) : null}
    </div>
  );
};
