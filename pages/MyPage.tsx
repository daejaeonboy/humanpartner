import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { Calendar, User, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getUserBookings, Booking } from '../src/api/bookingApi';
import { useAuth } from '../src/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const MyPage: React.FC = () => {
    const { user, userProfile, logout } = useAuth();
    const navigate = useNavigate();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchBookings = async () => {
            if (!user) {
                setLoading(false);
                return;
            }
            try {
                const data = await getUserBookings(user.uid);
                setBookings(data);
            } catch (error) {
                console.error('Failed to fetch bookings:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchBookings();
    }, [user]);

    const getStatusBadge = (status: Booking['status']) => {
        const config = {
            pending: { 
                className: 'bg-orange-100 border border-orange-300 text-orange-800', 
                icon: Calendar, 
                label: '예약 대기 중' 
            },
            confirmed: { 
                className: 'bg-blue-100 border border-blue-300 text-blue-800', 
                icon: CheckCircle, 
                label: '예약 확정' 
            },
            cancelled: { 
                className: 'bg-gray-100 border border-gray-300 text-gray-700', 
                icon: XCircle, 
                label: '예약 취소' 
            },
        };
        const { className, icon: Icon, label } = config[status];
        return (
            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-bold shadow-sm ${className}`}>
                <Icon size={14} strokeWidth={2.5} />
                {label}
            </span>
        );
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };
    // Helper to get image for basic components and options
    const getItemImage = (name: string) => {
      if (name.includes("노트북") || name.includes("PC") || name.includes("모니터")) return "/comp-notebook.png"; 
      if (name.includes("테이블") || name.includes("책상") || name.includes("데스크")) return "/comp-table.png";
      if (name.includes("의자") || name.includes("소파")) return "/comp-chair.png";
      if (name.includes("복합기") || name.includes("프린터")) return "/comp-printer.png";
      if (name.includes("냉장고")) return "/comp-fridge.png";
      if (name.includes("커피") || name.includes("머신")) return "/comp-coffee.png";
      if (name.includes("간식") || name.includes("다과")) return "/comp-coffee.png";
      if (name.includes("배너") || name.includes("현수막")) return "/comp-printer.png"; // Fallback
      return null;
    };


    if (!user) {
        return (
            <div className="py-20 text-center">
                <p className="text-gray-500 mb-4">로그인이 필요합니다.</p>
                <Link to="/login" className="text-[#FF5B60] underline">로그인하기</Link>
            </div>
        );
    }

    return (
        <div className="py-12 bg-gray-50 min-h-screen">
            <Container>
                <div className="flex flex-col md:flex-row gap-8">
                    {/* Sidebar / User Profile Summary */}
                    <div className="md:w-1/4">
                        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm text-center">
                            <div className="w-20 h-20 bg-[#B3C1D4] rounded-full mx-auto mb-4 flex items-center justify-center">
                                <User size={32} className="text-[#FF5B60]" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">{userProfile?.name || '고객'} 님</h2>
                            <p className="text-sm text-gray-500 mb-6">{userProfile?.email || user.email}</p>
                            <div className="text-left space-y-1 border-t border-gray-100 pt-4">
                                <Link to="/mypage" className="text-sm font-bold text-[#FF5B60] block w-full text-left py-2 px-2 rounded hover:bg-[#FF5B60]/5">
                                    예약 내역
                                </Link>
                                <Link to="#" className="text-sm text-gray-500 block w-full text-left py-2 px-2 rounded hover:bg-gray-50 hover:text-black" onClick={(e) => { e.preventDefault(); alert('준비 중인 기능입니다.'); }}>
                                    내 정보 관리
                                </Link>
                                <Link to="#" className="text-sm text-gray-500 block w-full text-left py-2 px-2 rounded hover:bg-gray-50 hover:text-black" onClick={(e) => { e.preventDefault(); alert('준비 중인 기능입니다.'); }}>
                                    1:1 문의 내역
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Main Content / Booking List */}
                    <div className="md:w-3/4">
                        <h1 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-2">
                            <Clock size={24} /> 내 예약 내역
                        </h1>

                        {loading ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
                            </div>
                        ) : bookings.length === 0 ? (
                            <div className="bg-white p-12 rounded-xl border border-gray-200 text-center">
                                <p className="text-gray-500 mb-4">예약 내역이 없습니다.</p>
                                <Link to="/products" className="text-[#FF5B60] underline">상품 둘러보기</Link>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bookings.map((booking) => (
                                    <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-6 transition-all hover:shadow-md">
                                        {/* Mobile/Tablet Layout (Visible on screens < lg) */}
                                        <div 
                                            className="lg:hidden cursor-pointer active:bg-gray-50 transition-colors"
                                            onClick={() => navigate(`/products/${booking.product_id}`)}
                                        >
                                            <div className="relative aspect-video bg-gray-100">
                                                <img
                                                    src={booking.products?.image_url || 'https://picsum.photos/seed/booking/800/600'}
                                                    alt={booking.products?.name || '상품'}
                                                    className="w-full h-full object-cover"
                                                />
                                                <div className="absolute top-4 left-4">
                                                    {getStatusBadge(booking.status)}
                                                </div>
                                            </div>
                                            <div className="p-5">
                                                <h3 className="font-extrabold text-lg text-gray-900 mb-2 leading-tight">
                                                    {booking.products?.name || '상품'}
                                                </h3>
                                                <div className="text-sm text-gray-500 flex items-center gap-2 mb-6">
                                                    <span className="font-medium">{formatDate(booking.start_date)} ~ {formatDate(booking.end_date)}</span>
                                                </div>

                                                {(booking.selected_options?.length || 0) + (booking.basic_components?.length || 0) > 0 && (
                                                     <button
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            const el = document.getElementById(`details-${booking.id}`);
                                                            if (el) el.classList.toggle('hidden');
                                                        }}
                                                        className="w-full py-4 bg-[#FF5B60] text-white rounded-xl text-base font-bold hover:bg-[#E04F54] transition-all shadow-md active:scale-[0.98]"
                                                    >
                                                        예약 내역보기
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Desktop Layout (Visible on screens >= lg) */}
                                        <div 
                                            className="hidden lg:flex p-6 md:p-8 flex-col md:flex-row justify-between items-center gap-6 border-b border-gray-50 cursor-pointer hover:bg-gray-50 transition-colors"
                                            onClick={() => navigate(`/products/${booking.product_id}`)}
                                        >
                                            <div className="flex gap-8 items-center flex-grow">
                                                {/* Left: Image */}
                                                <div className="w-32 h-32 bg-gray-100 rounded-2xl overflow-hidden flex-shrink-0 shadow-sm border border-gray-100">
                                                    <img
                                                        src={booking.products?.image_url || 'https://picsum.photos/seed/booking/200/200'}
                                                        alt={booking.products?.name || '상품'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                
                                                {/* Center: Info */}
                                                <div className="min-w-0 flex flex-col gap-3">
                                                    <div className="flex items-center gap-3">
                                                        {getStatusBadge(booking.status)}
                                                        <span className="text-xs text-gray-400 font-medium tracking-tight">예약번호 {booking.id?.slice(0, 8)}</span>
                                                    </div>
                                                    <h3 className="font-extrabold text-2xl text-gray-900 leading-tight tracking-tight">
                                                        {booking.products?.name || '상품'}
                                                    </h3>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2 font-medium">
                                                        <Calendar size={14} className="text-gray-300" />
                                                        <span>{formatDate(booking.start_date)} ~ {formatDate(booking.end_date)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Right: Actions & Price */}
                                            <div className="flex flex-col items-end gap-4 flex-shrink-0 min-w-[180px]">
                                                <div className="text-2xl font-bold text-[#FF5B60] tracking-tight">
                                                    {booking.total_price.toLocaleString()}원
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    {(booking.selected_options?.length || 0) + (booking.basic_components?.length || 0) > 0 && (
                                                        <button
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                const el = document.getElementById(`details-${booking.id}`);
                                                                if (el) el.classList.toggle('hidden');
                                                            }}
                                                            className="px-5 py-2.5 bg-[#FF5B60] text-white rounded-lg text-sm font-bold hover:bg-[#E04F54] transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                            상세 구성 내역
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Expandable Details Section - Vertical & Wide */}
                                        <div id={`details-${booking.id}`} className="hidden bg-[#FAFAFA] border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="p-6 md:p-8 space-y-12 bg-white">
                                                {/* Detail Block: Basic Package (Method A: Line & Divider) */}
                                                {booking.basic_components && booking.basic_components.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                                                <span className="w-1.5 h-6 bg-slate-800 inline-block rounded-sm"></span>
                                                                기본 패키지 구성
                                                            </h4>
                                                            <span className="text-sm text-gray-500 font-medium">총 {booking.basic_components.length}개 품목</span>
                                                        </div>
                                                        
                                                        <div className="border-t-2 border-slate-900 pt-6">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                                                {booking.basic_components.map((comp, i) => {
                                                                     const imageUrl = getItemImage(comp.name);
                                                                     return (
                                                                        <div key={i} className="flex items-center gap-4 group">
                                                                            <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                                                                {imageUrl ? (
                                                                                    <img src={imageUrl} alt={comp.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-icon'); }} />
                                                                                ) : (
                                                                                    <div className="text-gray-300">📦</div>
                                                                                )}
                                                                            </div>
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex justify-between items-start">
                                                                                    <div>
                                                                                        <p className="font-bold text-gray-800 text-lg leading-tight">{comp.name}</p>
                                                                                        {comp.model_name && <p className="text-xs text-gray-400 mt-1">{comp.model_name}</p>}
                                                                                    </div>
                                                                                    <span className="text-lg font-bold text-[#FF5B60] whitespace-nowrap ml-2">{comp.quantity}개</span>
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                     );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Detail Block: Selected Options (Method A: Line & Divider) */}
                                                {booking.selected_options && booking.selected_options.length > 0 && (
                                                    <div>
                                                        <div className="flex items-center justify-between mb-4">
                                                            <h4 className="text-xl font-bold text-gray-900 flex items-center gap-3">
                                                                <span className="w-1.5 h-6 bg-[#FF5B60] inline-block rounded-sm"></span>
                                                                내가 추가한 유료 옵션
                                                            </h4>
                                                            <span className="text-sm text-[#FF5B60] font-bold">{booking.selected_options.length}개 선택</span>
                                                        </div>

                                                        <div className="border-t-2 border-[#FF5B60] pt-6">
                                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                                                {booking.selected_options.map((opt, i) => {
                                                                     const imageUrl = getItemImage(opt.name);
                                                                     return (
                                                                         <div key={i} className="flex items-center gap-4 group">
                                                                            <div className="w-14 h-14 flex-shrink-0 rounded-lg bg-gray-50 flex items-center justify-center overflow-hidden border border-gray-100">
                                                                                {imageUrl ? (
                                                                                    <img src={imageUrl} alt={opt.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.style.display = 'none'; e.currentTarget.parentElement?.classList.add('fallback-icon'); }} />
                                                                                ) : (
                                                                                    <div className="text-gray-300">⚡</div>
                                                                                )}
                                                                            </div>
                                                                             <div className="flex-1 min-w-0">
                                                                                 <div className="flex justify-between items-start">
                                                                                     <div>
                                                                                         <p className="font-bold text-gray-800 text-lg leading-tight">{opt.name}</p>
                                                                                         <p className="text-xs text-gray-500 mt-1">{opt.price.toLocaleString()}원 × {opt.quantity}개</p>
                                                                                     </div>
                                                                                     <div className="text-right">
                                                                                          <span className="text-lg font-bold text-[#FF5B60]">{(opt.price * opt.quantity).toLocaleString()}원</span>
                                                                                     </div>
                                                                                 </div>
                                                                             </div>
                                                                         </div>
                                                                     );
                                                                })}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </Container>
        </div>
    );

};
