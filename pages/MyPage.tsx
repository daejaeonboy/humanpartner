import React, { useState, useEffect } from 'react';
import { Container } from '../components/ui/Container';
import { Calendar, User, Clock, Loader2, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { getUserBookings, Booking } from '../src/api/bookingApi';
import { useAuth } from '../src/context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const MyPage: React.FC = () => {
    const { user, logout } = useAuth();
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
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: AlertCircle, label: '대기중' },
            confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '확정됨' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '취소됨' },
        };
        const { bg, text, icon: Icon, label } = config[status];
        return (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold ${bg} ${text}`}>
                <Icon size={12} />
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
                            <h2 className="text-lg font-bold text-gray-900">{user.email?.split('@')[0]} 님</h2>
                            <p className="text-sm text-gray-500 mb-6">{user.email}</p>
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
                                    <div key={booking.id} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mb-8 transition-all hover:shadow-md">
                                        {/* 1. Top Section: Core Info & Main Actions */}
                                        <div className="p-6 md:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-50">
                                            <div className="flex gap-6 items-center flex-grow">
                                                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0 shadow-inner">
                                                    <img
                                                        src={booking.products?.image_url || 'https://picsum.photos/seed/booking/200/200'}
                                                        alt={booking.products?.name || '상품'}
                                                        className="w-full h-full object-cover"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="flex items-center gap-3 mb-2">
                                                        {getStatusBadge(booking.status)}
                                                        <span className="text-[12px] text-gray-400 font-medium">예약번호 {booking.id?.slice(0, 8)}</span>
                                                    </div>
                                                    <h3 className="font-extrabold text-xl text-gray-900 mb-2 leading-tight">
                                                        {booking.products?.name || '상품'}
                                                    </h3>
                                                    <div className="text-sm text-gray-500 flex items-center gap-2">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        <span className="font-medium">{formatDate(booking.start_date)} ~ {formatDate(booking.end_date)}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="flex flex-col items-end gap-3 flex-shrink-0">
                                                <div className="text-2xl font-black text-[#FF5B60] mb-1">
                                                    {booking.total_price.toLocaleString()}원
                                                </div>
                                                <div className="flex gap-2 w-full md:w-auto">
                                                    <Link
                                                        to={`/products/${booking.product_id}`}
                                                        className="px-6 py-2.5 bg-white border border-gray-200 rounded-lg text-sm font-bold text-gray-700 hover:border-gray-400 hover:bg-gray-50 transition-all text-center"
                                                    >
                                                        상품보기
                                                    </Link>
                                                    {(booking.selected_options?.length || 0) + (booking.basic_components?.length || 0) > 0 && (
                                                        <button
                                                            onClick={() => {
                                                                const el = document.getElementById(`details-${booking.id}`);
                                                                if (el) el.classList.toggle('hidden');
                                                            }}
                                                            className="px-6 py-2.5 bg-[#FF5B60] text-white rounded-lg text-sm font-bold hover:bg-[#E04F54] transition-all shadow-sm flex items-center gap-2"
                                                        >
                                                            상세 구성 내역
                                                        </button>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* 2. Expandable Details Section - Vertical & Wide */}
                                        <div id={`details-${booking.id}`} className="hidden bg-[#FAFAFA] border-t border-gray-100 animate-in fade-in slide-in-from-top-4 duration-500">
                                            <div className="p-6 md:p-8 space-y-8">
                                                {/* Detail Block: Basic Package (Vertical, Wide) */}
                                                {booking.basic_components && booking.basic_components.length > 0 && (
                                                    <div className="bg-white rounded-xl border border-gray-100 p-6 shadow-sm">
                                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                                                            <div className="w-1.5 h-5 bg-gray-300 rounded-full"></div>
                                                            <h4 className="font-extrabold text-gray-900">기본 패키지 구성</h4>
                                                            <span className="text-xs text-gray-400 font-medium ml-auto">총 {booking.basic_components.length}개 품목</span>
                                                        </div>
                                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-4">
                                                            {booking.basic_components.map((comp, i) => (
                                                                <div key={i} className="flex justify-between items-center py-2 px-3 hover:bg-gray-50 rounded-lg transition-colors group">
                                                                    <div className="flex flex-col min-w-0">
                                                                        <span className="text-base font-bold text-gray-800 truncate">{comp.name}</span>
                                                                        {comp.model_name && <span className="text-xs text-gray-400">{comp.model_name}</span>}
                                                                    </div>
                                                                    <div className="flex items-center gap-2">
                                                                        <span className="text-xs text-gray-400 font-medium">수량</span>
                                                                        <span className="text-base font-black text-gray-900 bg-gray-100 px-2 py-0.5 rounded min-w-[34px] text-center">{comp.quantity}</span>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}

                                                {/* Detail Block: Selected Options (Vertical, Wide) */}
                                                {booking.selected_options && booking.selected_options.length > 0 && (
                                                    <div className="bg-white rounded-xl border border-[#FF5B60]/10 p-6 shadow-sm relative overflow-hidden">
                                                        <div className="absolute top-0 right-0 w-32 h-32 bg-[#FF5B60]/5 rounded-bl-full -mr-12 -mt-12 pointer-events-none"></div>
                                                        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-50">
                                                            <div className="w-1.5 h-5 bg-[#FF5B60] rounded-full shadow-[0_0_8px_rgba(255,91,96,0.5)]"></div>
                                                            <h4 className="font-extrabold text-gray-900">내가 추가한 유료 옵션</h4>
                                                            <span className="text-xs text-[#FF5B60] font-bold ml-auto">{booking.selected_options.length}개 선택</span>
                                                        </div>
                                                        <div className="space-y-3">
                                                            {booking.selected_options.map((opt, i) => (
                                                                <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between py-3 px-4 bg-[#FFF9F9] rounded-xl border border-[#FFEAEA] group hover:border-[#FFD5D6] transition-all">
                                                                    <div className="flex items-center gap-4 mb-2 sm:mb-0">
                                                                        <div className="w-9 h-9 rounded-full bg-[#FF5B60] text-white flex items-center justify-center text-sm font-black shadow-sm group-hover:scale-110 transition-transform">{i + 1}</div>
                                                                        <div className="flex flex-col">
                                                                            <span className="text-base font-extrabold text-gray-800">{opt.name}</span>
                                                                            <span className="text-[13px] text-gray-500">{opt.price.toLocaleString()}원 × {opt.quantity}개</span>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-xl font-black text-[#FF5B60]">{(opt.price * opt.quantity).toLocaleString()}원</span>
                                                                    </div>
                                                                </div>
                                                            ))}
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
