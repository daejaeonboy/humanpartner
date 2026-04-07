import React, { useEffect, useState, useMemo } from 'react';
import { X, ChevronRight, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavMenuItem } from '../../src/api/cmsApi';
import { Container } from '../ui/Container';
import { useAuth } from '../../src/context/AuthContext';
import { usePublicContent } from '../../src/context/PublicContentContext';

interface FullMenuProps {
    onClose: () => void;
    variant?: 'mobile' | 'desktop';
    items?: NavMenuItem[];
}

export const FullMenu: React.FC<FullMenuProps> = ({ onClose, variant = 'mobile', items }) => {
    const { user, userProfile, logout } = useAuth();
    const { navMenuItems, loading: loadingPublicContent } = usePublicContent();
    const menuItems = items ?? navMenuItems;
    const loading = !items && loadingPublicContent;

    useEffect(() => {
        // Prevent body scroll only for mobile overlay
        if (variant === 'mobile') {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [variant]);

    // Grouping: Parent (items with no category or unique category names) -> Children
    const groups = React.useMemo(() => {
        const pMap = new Map<string, { name: string; items: NavMenuItem[]; display_order: number }>();

        // 1. Identify all defined parent items to check existence (Active + Inactive)
        const allDefinedParents = menuItems.filter(i => !i.category);
        const definedParentNames = new Set(allDefinedParents.map(p => p.name));

        // 2. Process ACTIVE Parents
        // We only create groups for Active Parents.
        // Inactive Parents are skipped, effectively hiding the group.
        allDefinedParents.forEach(p => {
            if (p.is_active) {
                pMap.set(p.name, {
                    name: p.name,
                    items: [],
                    display_order: p.display_order
                });
            }
        });

        // 3. Process ACTIVE Children
        const activeChildren = menuItems.filter(i => i.is_active && i.category);

        activeChildren.forEach(child => {
            const cat = child.category!;

            if (pMap.has(cat)) {
                // Belongs to an Active Parent
                pMap.get(cat)!.items.push(child);
            } else if (!definedParentNames.has(cat)) {
                // Orphan (Implicit Group) - Parent doesn't exist at all
                // Create implicit group
                if (!pMap.has(cat)) {
                    pMap.set(cat, { name: cat, items: [], display_order: 9999 });
                }
                pMap.get(cat)!.items.push(child);
            }
            // Else: Parent exists but is Inactive -> Skip child (Hide)
        });

        // 4. Convert to array and sort
        return Array.from(pMap.values()).sort((a, b) => a.display_order - b.display_order).map(g => ({
            ...g,
            items: g.items.sort((a, b) => a.display_order - b.display_order)
        }));
    }, [menuItems]);

    // State for Mobile Accordion
    const [openSections, setOpenSections] = useState<Set<string>>(new Set());

    const toggleSection = (name: string) => {
        const newSet = new Set(openSections);
        if (newSet.has(name)) {
            newSet.delete(name);
        } else {
            newSet.add(name);
        }
        setOpenSections(newSet);
    };

    const getCategoryLink = (categoryName: string) => `/products?category=${encodeURIComponent(categoryName)}`;
    const getGroupLink = (groupName: string) => {
        const parentObj = menuItems.find(i => i.name === groupName && !i.category);
        const hasChildren = menuItems.some(i => i.is_active && i.category === groupName);

        if (hasChildren) {
            return getCategoryLink(groupName);
        }

        return parentObj?.link || getCategoryLink(groupName);
    };

    return (
        <div
            className={`z-50 ${variant === 'mobile' ? 'fixed inset-0' : 'absolute top-full left-0 w-full'}`}
            style={variant === 'mobile' ? { zIndex: 9999 } : {}}
        >
            {/* Backdrop for Mobile */}
            {variant === 'mobile' && (
                <div
                    className="absolute inset-0 bg-black/50 animate-fadeIn"
                    onClick={onClose}
                />
            )}

            {/* Panel */}
            <div
                className={`
                    bg-white flex flex-col h-full
                    ${variant === 'mobile'
                        ? 'absolute right-0 w-[85%] max-w-sm shadow-2xl animate-slideInRight'
                        : 'w-full border-t border-slate-200 shadow-xl max-h-[70vh]'}
                `}
                onMouseLeave={variant === 'desktop' ? onClose : undefined}
            >
                {/* Header - Only for Mobile */}
                {variant === 'mobile' && (
                    <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                        <img src="/Miceday_Logo.png" alt="행사어때" className="h-6 object-contain" decoding="async" />
                        <button onClick={onClose} className="p-2 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors">
                            <X size={24} className="text-slate-800" />
                        </button>
                    </div>
                )}

                {/* Content */}
                <div className={`flex-1 overflow-y-auto ${variant === 'mobile' ? '' : 'p-8'}`}>
                    {variant === 'mobile' && (
                        <div className="px-5 py-6 border-b border-gray-100 mb-2">
                            {user ? (
                                <div className="flex flex-col gap-4">
                                    <h3 className="font-bold text-slate-800 text-xl leading-tight">
                                        {userProfile?.name || '사용자'}님, 안녕하세요!
                                    </h3>
                                    <div className="flex gap-2">
                                        <Link to="/mypage" onClick={onClose} className="flex-1 py-2 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-[#39B54A]/10 hover:text-[#39B54A] transition-all text-center">마이페이지</Link>
                                        <Link to="/cs" onClick={onClose} className="flex-1 py-2 rounded-lg border border-slate-200 text-slate-500 font-bold text-xs hover:bg-[#39B54A]/5 hover:border-[#39B54A]/30 hover:text-[#39B54A] transition-all text-center">고객센터</Link>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col gap-3">
                                    <h3 className="font-bold text-slate-800 text-xl">환영합니다!</h3>
                                    <div className="flex gap-2">
                                        <Link to="/login" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-[#39B54A] text-white font-bold text-xs hover:bg-[#2F9A3F] transition-colors text-center">로그인</Link>
                                        <Link to="/signup" onClick={onClose} className="flex-1 py-2.5 rounded-lg bg-slate-100 text-slate-700 font-bold text-xs hover:bg-slate-200 transition-colors text-center">회원가입</Link>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}
                    <Container className={variant === 'mobile' ? '!px-5 !w-full !max-w-none' : ''}>
                        <div className={`${variant === 'mobile' ? 'space-y-2 pb-10' : 'grid grid-cols-1 md:grid-cols-4 gap-8'}`}>
                            {groups.map((group, idx) => (
                                <div key={idx} className={`${variant === 'mobile' ? 'border-b border-gray-50 last:border-0' : ''}`}>
                                    {/* Group Title */}
                                    {variant === 'mobile' ? (
                                        <div className="flex items-center gap-3 py-4">
                                            <Link
                                                to={getGroupLink(group.name)}
                                                onClick={onClose}
                                                className={`flex-1 text-base font-bold transition-colors hover:text-[#39B54A] ${openSections.has(group.name) ? 'text-[#39B54A]' : 'text-slate-800'}`}
                                            >
                                                {group.name}
                                            </Link>
                                            {group.items.length > 0 && (
                                                <button
                                                    type="button"
                                                    onClick={() => toggleSection(group.name)}
                                                    className="p-1 text-slate-400 hover:text-[#39B54A] transition-colors"
                                                    aria-label={`${group.name} 하위 메뉴 펼치기`}
                                                >
                                                    <ChevronRight
                                                        size={20}
                                                        className={`transition-transform duration-300 ${openSections.has(group.name) ? 'rotate-90 text-[#39B54A]' : ''}`}
                                                    />
                                                </button>
                                            )}
                                        </div>
                                    ) : (
                                        <Link
                                            to={getGroupLink(group.name)}
                                            onClick={onClose}
                                            className="block text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4 hover:text-[#39B54A] transition-colors"
                                        >
                                            {group.name}
                                        </Link>
                                    )}

                                    {/* Items List - Collapsible on Mobile */}
                                    <div className={`
                                    ${variant === 'mobile'
                                            ? group.items.length > 0
                                                ? `overflow-hidden transition-all duration-300 ease-in-out ${openSections.has(group.name) ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`
                                                : 'block pb-4'
                                            : 'block'}
                                `}>
                                        <ul className={`${variant === 'mobile' ? 'bg-slate-50/50 rounded-lg p-3 space-y-1' : 'space-y-3'}`}>
                                            {group.items.length > 0 ? (
                                                group.items.map(item => (
                                                    <li key={item.id}>
                                                        <Link
                                                            to={`/products?category=${encodeURIComponent(item.name)}` /*&title removed to keep URL simple*/}
                                                            onClick={onClose}
                                                            className={`block transition-all hover:text-[#39B54A]
                                                            ${variant === 'mobile'
                                                                    ? 'p-3 text-sm text-slate-600 font-medium hover:bg-[#39B54A]/5 rounded-lg flex items-center justify-between'
                                                                    : 'text-slate-600 flex items-center gap-1 group text-sm'}
                                                        `}
                                                        >
                                                            {item.name}
                                                            {variant === 'mobile' && <ChevronRight size={14} className="text-slate-300" />}
                                                        </Link>
                                                    </li>
                                                ))
                                            ) : (
                                                <li>
                                                    <Link
                                                        to={getGroupLink(group.name)}
                                                        onClick={onClose}
                                                        className={`block transition-all hover:text-[#39B54A]
                                                        ${variant === 'mobile'
                                                                ? 'p-3 text-sm text-slate-600 font-medium hover:bg-[#39B54A]/5 rounded-lg'
                                                                : 'text-slate-600 flex items-center gap-1 group text-sm'}
                                                    `}
                                                    >
                                                        바로가기
                                                    </Link>
                                                </li>
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                            {user && variant === 'mobile' && (
                                <div className="mt-10 pt-4 border-t border-gray-100 flex justify-center">
                                    <button
                                        onClick={() => { logout(); onClose(); }}
                                        className="py-3 px-8 rounded-lg bg-slate-50 text-slate-400 font-medium text-sm hover:bg-[#39B54A]/5 hover:text-[#39B54A] transition-colors"
                                    >
                                        로그아웃
                                    </button>
                                </div>
                            )}
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
};
