import React, { useEffect, useState, useMemo } from 'react';
import { X, ChevronRight, Phone, Mail } from 'lucide-react';
import { Link } from 'react-router-dom';
import { NavMenuItem, getAllNavMenuItems } from '../../src/api/cmsApi';
import { Container } from '../ui/Container';
import { useAuth } from '../../src/context/AuthContext';

interface FullMenuProps {
    onClose: () => void;
    variant?: 'mobile' | 'desktop';
    items?: NavMenuItem[];
}

export const FullMenu: React.FC<FullMenuProps> = ({ onClose, variant = 'mobile', items }) => {
    const [menuItems, setMenuItems] = useState<NavMenuItem[]>([]);
    const [loading, setLoading] = useState(true);
    const { user, userProfile, logout } = useAuth();

    useEffect(() => {
        if (items) {
            setMenuItems(items);
            setLoading(false);
            return;
        }

        const loadMenu = async () => {
            try {
                const data = await getAllNavMenuItems();
                setMenuItems(data);
            } catch (error) {
                console.error('Failed to load menu:', error);
            } finally {
                setLoading(false);
            }
        };
        loadMenu();

        // Prevent body scroll only for mobile overlay
        if (variant === 'mobile') {
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = 'unset';
            };
        }
    }, [variant, items]);

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
                    <>
                        <div className="flex justify-between items-center p-5 border-b border-gray-100 bg-white sticky top-0 z-10">
                            <img src="/logo.png" alt="행사어때" className="h-5 object-contain" />
                            <button onClick={onClose} className="p-2 bg-gray-50 rounded-full hover:bg-gray-100 transition-colors">
                                <X size={24} className="text-slate-800" />
                            </button>
                        </div>

                        {/* Login/Signup OR Profile Card */}
                        <div className="px-5 py-6 bg-slate-50">
                            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center">
                                {user ? (
                                    <>
                                        <div className="mb-4">
                                            <div className="w-16 h-16 bg-[#FF5B60]/10 text-[#FF5B60] rounded-full flex items-center justify-center mx-auto mb-3 font-bold text-xl">
                                                {userProfile?.name?.[0] || user.email?.[0]?.toUpperCase() || 'U'}
                                            </div>
                                            <h3 className="font-bold text-lg text-slate-800 mb-1">
                                                {userProfile?.name || '사용자'}님, 안녕하세요!
                                            </h3>
                                            <p className="text-sm text-slate-500">행사어때와 함께 멋진 행사를 기획해보세요.</p>
                                        </div>
                                        <div className="flex gap-3">
                                            <Link to="/mypage" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors text-center">마이페이지</Link>
                                            <button
                                                onClick={() => { logout(); onClose(); }}
                                                className="flex-1 py-3 rounded-xl border border-slate-200 text-slate-500 font-bold text-sm hover:bg-slate-50 transition-colors"
                                            >
                                                로그아웃
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <h3 className="font-bold text-lg text-slate-800 mb-1">환영합니다!</h3>
                                        <p className="text-sm text-slate-500 mb-4">로그인하고 더 많은 혜택을 받아보세요.</p>
                                        <div className="flex gap-3">
                                            <Link to="/login" onClick={onClose} className="flex-1 py-3 rounded-xl bg-[#FF5B60] text-white font-bold text-sm hover:bg-[#e54a4f] transition-colors text-center">로그인</Link>
                                            <Link to="/signup" onClick={onClose} className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-bold text-sm hover:bg-slate-200 transition-colors text-center">회원가입</Link>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* Content */}
                <div className={`flex-1 overflow-y-auto ${variant === 'mobile' ? '' : 'p-8'}`}>
                    <Container className={variant === 'mobile' ? '!px-5 !w-full !max-w-none' : ''}>
                        <div className={`${variant === 'mobile' ? 'space-y-2 pb-10' : 'grid grid-cols-1 md:grid-cols-4 gap-8'}`}>
                            {groups.map((group, idx) => (
                                <div key={idx} className={`${variant === 'mobile' ? 'border-b border-gray-50 last:border-0' : ''}`}>
                                    {/* Group Title */}
                                    {variant === 'mobile' ? (
                                        <button
                                            onClick={() => toggleSection(group.name)}
                                            className="w-full flex items-center justify-between py-4 text-left"
                                        >
                                            <span className={`text-base font-bold ${openSections.has(group.name) ? 'text-[#FF5B60]' : 'text-slate-800'}`}>
                                                {group.name}
                                            </span>
                                            <ChevronRight
                                                size={20}
                                                className={`text-slate-400 transition-transform duration-300 ${openSections.has(group.name) ? 'rotate-90 text-[#FF5B60]' : ''}`}
                                            />
                                        </button>
                                    ) : (
                                        <h3 className="text-lg font-bold text-slate-900 border-b border-slate-200 pb-2 mb-4">
                                            {group.name}
                                        </h3>
                                    )}

                                    {/* Items List - Collapsible on Mobile */}
                                    <div className={`
                                    ${variant === 'mobile'
                                            ? `overflow-hidden transition-all duration-300 ease-in-out ${openSections.has(group.name) ? 'max-h-[500px] opacity-100 pb-4' : 'max-h-0 opacity-0'}`
                                            : 'block'}
                                `}>
                                        <ul className={`${variant === 'mobile' ? 'bg-slate-50/50 rounded-xl p-3 space-y-1' : 'space-y-3'}`}>
                                            {group.items.length > 0 ? (
                                                group.items.map(item => (
                                                    <li key={item.id}>
                                                        <Link
                                                            to={`/products?category=${encodeURIComponent(item.name)}` /*&title removed to keep URL simple*/}
                                                            onClick={onClose}
                                                            className={`block transition-all hover:text-[#FF5B60]
                                                            ${variant === 'mobile'
                                                                    ? 'p-3 text-sm text-slate-600 font-medium hover:bg-[#FF5B60]/5 rounded-lg flex items-center justify-between'
                                                                    : 'text-slate-600 flex items-center gap-1 group text-sm'}
                                                        `}
                                                        >
                                                            {item.name}
                                                            {variant === 'mobile' && <ChevronRight size={14} className="text-slate-300" />}
                                                        </Link>
                                                    </li>
                                                ))
                                            ) : (
                                                (() => {
                                                    const parentObj = menuItems.find(i => i.name === group.name && !i.category);
                                                    return parentObj ? (
                                                        <li>
                                                            <Link
                                                                to={parentObj.link}
                                                                onClick={onClose}
                                                                className="block p-3 text-sm text-slate-600 font-medium hover:text-[#FF5B60]"
                                                            >
                                                                바로가기
                                                            </Link>
                                                        </li>
                                                    ) : null
                                                })()
                                            )}
                                        </ul>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Container>
                </div>
            </div>
        </div>
    );
};
