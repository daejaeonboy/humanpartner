import React, { useEffect, useState } from 'react';
import { Popup } from '../../src/api/cmsApi';
import { X } from 'lucide-react';
import { Link } from 'react-router-dom';
import { usePublicContent } from '../../src/context/PublicContentContext';

export const PopupManager: React.FC = () => {
    const { loading: loadingPublicContent, popups: popupItems } = usePublicContent();
    const [popups, setPopups] = useState<Popup[]>([]);

    useEffect(() => {
        const now = new Date();

        const activePopups = popupItems.filter(p => {
            if (!p.is_active) return false;

            if (p.start_date) {
                const start = new Date(p.start_date);
                start.setHours(0, 0, 0, 0);
                if (now < start) return false;
            }

            if (p.end_date) {
                const end = new Date(p.end_date);
                end.setHours(23, 59, 59, 999);
                if (now > end) return false;
            }

            const hideDate = localStorage.getItem(`hide_popup_${p.id}`);
            if (hideDate) {
                const today = new Date().toDateString();
                if (hideDate === today) return false;
            }

            return true;
        });

        setPopups(activePopups);
    }, [popupItems]);

    const closePopup = (id: string, hideToday: boolean = false) => {
        if (hideToday) {
            localStorage.setItem(`hide_popup_${id}`, new Date().toDateString());
        }
        setPopups(prev => prev.filter(p => p.id !== id));
    };

    if (loadingPublicContent || popups.length === 0) return null;

    return (
        <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center sm:block sm:inset-auto">
            {/* Mobile: Modal Style (One by one or stacked) */}
            {/* Desktop: Draggable or Fixed positions. For simplicity, we center them or stack them with slight offset */}

            {popups.map((popup, index) => (
                <div
                    key={popup.id}
                    className="pointer-events-auto fixed bg-white shadow-2xl rounded-lg overflow-hidden flex flex-col border border-slate-200"
                    style={{
                        top: window.innerWidth > 640 ? '100px' : '50%',
                        left: window.innerWidth > 640 ? `${100 + (index * 20)}px` : '50%',
                        transform: window.innerWidth > 640 ? 'none' : 'translate(-50%, -50%)',
                        zIndex: 1000 + index,
                        maxWidth: '90vw',
                        width: '400px',
                        maxHeight: '80vh'
                    }}
                >
                    {/* Image / Content */}
                    <div className="relative flex-1 bg-slate-50 min-h-[200px] flex items-center justify-center">
                        {/* Link wrapper if link or target_product_code exists */}
                        {(popup.target_product_code || popup.link) ? (
                            popup.link && popup.link.startsWith('http') ? (
                                <a
                                    href={popup.link}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full h-full block"
                                    onClick={() => closePopup(popup.id!)}
                                >
                                    <img
                                        src={popup.image_url || 'https://via.placeholder.com/400x400?text=Popup'}
                                        alt={popup.title}
                                        className="w-full h-auto object-contain"
                                        decoding="async"
                                    />
                                </a>
                            ) : (
                                <Link
                                    to={popup.target_product_code ? `/p/${popup.target_product_code}` : (popup.link || '/')}
                                    className='w-full h-full block'
                                    onClick={() => closePopup(popup.id!)}
                                >
                                    <img
                                        src={popup.image_url || 'https://via.placeholder.com/400x400?text=Popup'}
                                        alt={popup.title}
                                        className="w-full h-auto object-contain"
                                        decoding="async"
                                    />
                                </Link>
                            )
                        ) : (
                            <img
                                src={popup.image_url || 'https://via.placeholder.com/400x400?text=Popup'}
                                alt={popup.title}
                                className="w-full h-auto object-contain"
                                decoding="async"
                            />
                        )}
                    </div>

                    {/* Footer Actions */}
                    <div className="bg-slate-900 text-white p-3 flex justify-between items-center text-sm">
                        <button
                            onClick={() => closePopup(popup.id!, true)}
                            className="text-slate-300 hover:text-white transition-colors text-xs"
                        >
                            오늘 하루 보지 않기
                        </button>
                        <button
                            onClick={() => closePopup(popup.id!)}
                            className="font-bold flex items-center gap-1 hover:text-slate-300 transition-colors"
                        >
                            닫기 <X size={16} />
                        </button>
                    </div>
                </div>
            ))}
        </div>
    );
};
