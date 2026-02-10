import React, { useState, useEffect } from 'react';
import { Check, X, Loader2, Clock, CheckCircle, XCircle, Trash2, Phone, Building2 } from 'lucide-react';
import { getBookings, updateBookingStatus, deleteBooking, Booking } from '../../src/api/bookingApi';

export const BookingList = () => {
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [expandedId, setExpandedId] = useState<string | null>(null);

    useEffect(() => {
        loadBookings();
    }, []);

    const loadBookings = async () => {
        try {
            setLoading(true);
            const data = await getBookings();
            setBookings(data);
        } catch (error) {
            console.error('Failed to load bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusChange = async (id: string, status: Booking['status']) => {
        const statusLabel = status === 'confirmed' ? '확정' : '취소';
        if (!confirm(`이 예약을 ${statusLabel} 처리하시겠습니까?`)) return;

        setUpdatingId(id);
        try {
            await updateBookingStatus(id, status);
            setBookings(bookings.map(b => b.id === id ? { ...b, status } : b));
            alert(`예약이 ${statusLabel}되었습니다.`);
        } catch (error) {
            console.error('Failed to update status:', error);
            alert('상태 변경에 실패했습니다.');
        } finally {
            setUpdatingId(null);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('이 예약을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

        setDeletingId(id);
        try {
            await deleteBooking(id);
            setBookings(bookings.filter(b => b.id !== id));
            alert('예약이 삭제되었습니다.');
        } catch (error) {
            console.error('Failed to delete booking:', error);
            alert('삭제에 실패했습니다.');
        } finally {
            setDeletingId(null);
        }
    };

    const getStatusBadge = (status: Booking['status']) => {
        const config = {
            pending: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock, label: '대기중' },
            confirmed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle, label: '확정' },
            cancelled: { bg: 'bg-red-100', text: 'text-red-700', icon: XCircle, label: '취소' },
        };
        const { bg, text, icon: Icon, label } = config[status];
        return (
            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
                <Icon size={14} />
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

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="animate-spin text-[#FF5B60]" size={40} />
            </div>
        );
    }

    return (
        <div>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-2xl font-bold text-slate-800">예약 확인</h2>
                    <p className="text-slate-500 text-sm mt-1">총 {bookings.length}건</p>
                </div>
                <button
                    onClick={loadBookings}
                    className="text-sm text-[#FF5B60] hover:text-teal-700"
                >
                    새로고침
                </button>
            </div>

            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full min-w-[900px]">
                        <thead className="bg-slate-50 border-b">
                            <tr>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">상품</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">고객명</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">사업자명</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">연락처</th>
                                <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">기간</th>
                                <th className="text-right px-4 py-3 text-sm font-semibold text-slate-600">금액</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">상태</th>
                                <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">작업</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {bookings.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="text-center py-12 text-slate-400">
                                        예약 내역이 없습니다.
                                    </td>
                                </tr>
                            ) : (
                                bookings.map((booking) => (
                                    <React.Fragment key={booking.id}>
                                        <tr
                                            className={`hover:bg-slate-50 cursor-pointer transition-colors ${expandedId === booking.id ? 'bg-slate-50' : ''}`}
                                            onClick={() => setExpandedId(expandedId === booking.id ? null : (booking.id || null))}
                                        >
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-3">
                                                    {booking.products?.image_url && (
                                                        <img
                                                            src={booking.products.image_url}
                                                            alt={booking.products.name}
                                                            className="w-10 h-10 object-cover rounded-lg shadow-sm"
                                                        />
                                                    )}
                                                    <span className="font-bold text-slate-800">
                                                        {booking.products?.name || booking.product_id}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="text-slate-900 font-bold">
                                                    {booking.user_profiles?.name || '-'}
                                                </div>
                                                <div className="text-[11px] text-slate-400">
                                                    {booking.user_email || booking.user_id}
                                                </div>
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                    <Building2 size={14} className="text-slate-400" />
                                                    <span>{booking.user_profiles?.company_name || '-'}</span>
                                                </div>
                                                {booking.user_profiles?.business_number && (
                                                    <div className="text-[11px] text-slate-400 mt-0.5 ml-5">
                                                        {booking.user_profiles.business_number}
                                                    </div>
                                                )}
                                            </td>
                                            <td className="px-4 py-4">
                                                <div className="flex items-center gap-1.5 text-slate-600 font-medium">
                                                    <Phone size={14} className="text-slate-400" />
                                                    <span>{booking.user_profiles?.phone || '-'}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-slate-600 text-sm font-medium">
                                                <div className="flex flex-col">
                                                    <span>{formatDate(booking.start_date)}</span>
                                                    <span className="text-slate-300 text-[10px] py-0.5">↓</span>
                                                    <span>{formatDate(booking.end_date)}</span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-4 text-right font-black text-slate-900">
                                                {booking.total_price.toLocaleString()}원
                                            </td>
                                            <td className="px-4 py-4 text-center">
                                                {getStatusBadge(booking.status)}
                                            </td>
                                            <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                                                <div className="flex items-center justify-center gap-1">
                                                    {updatingId === booking.id || deletingId === booking.id ? (
                                                        <Loader2 className="animate-spin text-slate-400" size={20} />
                                                    ) : (
                                                        <>
                                                            {booking.status !== 'confirmed' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(booking.id!, 'confirmed')}
                                                                    className="p-1.5 text-green-500 hover:bg-green-50 rounded-lg transition-colors"
                                                                    title="확정"
                                                                >
                                                                    <Check size={18} />
                                                                </button>
                                                            )}
                                                            {booking.status !== 'cancelled' && (
                                                                <button
                                                                    onClick={() => handleStatusChange(booking.id!, 'cancelled')}
                                                                    className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition-colors"
                                                                    title="취소"
                                                                >
                                                                    <X size={18} />
                                                                </button>
                                                            )}
                                                            <button
                                                                onClick={() => handleDelete(booking.id!)}
                                                                className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="삭제"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                        {expandedId === booking.id && (
                                            <tr className="bg-slate-50/50">
                                                <td colSpan={8} className="px-8 py-6">
                                                    <div className="flex flex-col lg:flex-row gap-8 animate-in fade-in slide-in-from-top-2 duration-300">
                                                        {/* Detail Block: Basic */}
                                                        <div className="flex-1 bg-white p-5 rounded-xl border border-slate-200 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                                                                <div className="w-1.5 h-4 bg-slate-300 rounded-full"></div>
                                                                <h4 className="font-bold text-slate-800 text-sm">기본 구성 품목</h4>
                                                            </div>
                                                            {booking.basic_components && booking.basic_components.length > 0 ? (
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-2">
                                                                    {booking.basic_components.map((comp, i) => (
                                                                        <div key={i} className="flex justify-between items-center text-base">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-slate-700 font-medium">{comp.name}</span>
                                                                                {comp.model_name && <span className="text-xs text-slate-400">{comp.model_name}</span>}
                                                                            </div>
                                                                            <span className="font-bold text-slate-900 bg-slate-50 px-2.5 py-1 rounded border border-slate-100">{comp.quantity}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 italic py-2">기본 구성 정보가 없습니다.</p>
                                                            )}
                                                        </div>

                                                        {/* Detail Block: Options */}
                                                        <div className="flex-1 bg-white p-5 rounded-xl border border-[#FF5B60]/10 shadow-sm">
                                                            <div className="flex items-center gap-2 mb-4 pb-2 border-b border-slate-100">
                                                                <div className="w-1.5 h-4 bg-[#FF5B60] rounded-full"></div>
                                                                <h4 className="font-bold text-slate-800 text-sm">추가 선택 옵션</h4>
                                                            </div>
                                                            {booking.selected_options && booking.selected_options.length > 0 ? (
                                                                <div className="space-y-3">
                                                                    {booking.selected_options.map((opt, i) => (
                                                                        <div key={i} className="flex justify-between items-center bg-[#FFF9F9] p-3 rounded-lg border border-[#FFEAEA]">
                                                                            <div className="flex flex-col">
                                                                                <span className="text-base font-bold text-slate-800">{opt.name}</span>
                                                                                <span className="text-xs text-slate-400">{opt.price.toLocaleString()}원 × {opt.quantity}개</span>
                                                                            </div>
                                                                            <span className="font-black text-[#FF5B60] text-base">{(opt.price * opt.quantity).toLocaleString()}원</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <p className="text-xs text-slate-400 italic py-2">선택한 추가 옵션이 없습니다.</p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </React.Fragment>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};
