import React, { useEffect, useMemo, useState } from 'react';
import {
    AlertCircle,
    Bell,
    BellOff,
    CheckCircle2,
    Loader2,
    Mail,
    Plus,
    RefreshCcw,
    Trash2,
    XCircle,
} from 'lucide-react';
import { useAuth } from '../../src/context/AuthContext';
import {
    addBookingEmailRecipient,
    BookingEmailLog,
    BookingEmailRecipient,
    BookingEmailSettings,
    deleteBookingEmailRecipient,
    getBookingEmailLogs,
    getBookingEmailRecipients,
    getBookingEmailSettings,
    updateBookingEmailRecipient,
    updateBookingEmailSettings,
} from '../../src/api/bookingEmailApi';

const formatDateTime = (value?: string) => {
    if (!value) return '-';
    const date = new Date(value);
    return `${date.getFullYear()}.${String(date.getMonth() + 1).padStart(2, '0')}.${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
};

const isValidEmail = (value: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

const statusMeta: Record<BookingEmailLog['status'], { label: string; className: string; icon: typeof CheckCircle2 }> = {
    sent: {
        label: '발송 완료',
        className: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        icon: CheckCircle2,
    },
    failed: {
        label: '발송 실패',
        className: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: XCircle,
    },
    skipped: {
        label: '발송 중지',
        className: 'bg-slate-100 text-slate-600 border-slate-200',
        icon: AlertCircle,
    },
};

export const BookingEmailSettingsPage: React.FC = () => {
    const { userProfile } = useAuth();
    const [settings, setSettings] = useState<BookingEmailSettings | null>(null);
    const [recipients, setRecipients] = useState<BookingEmailRecipient[]>([]);
    const [logs, setLogs] = useState<BookingEmailLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshingLogs, setRefreshingLogs] = useState(false);
    const [newEmail, setNewEmail] = useState('');
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const activeRecipientCount = useMemo(
        () => recipients.filter((recipient) => recipient.is_active).length,
        [recipients],
    );

    const loadData = async (showLogSpinner = false) => {
        if (showLogSpinner) {
            setRefreshingLogs(true);
        } else {
            setLoading(true);
        }

        setError(null);

        try {
            const [nextSettings, nextRecipients, nextLogs] = await Promise.all([
                getBookingEmailSettings(),
                getBookingEmailRecipients(),
                getBookingEmailLogs(),
            ]);

            setSettings(nextSettings);
            setRecipients(nextRecipients);
            setLogs(nextLogs);
        } catch (loadError) {
            console.error('Failed to load booking email settings:', loadError);
            setError('견적 메일 설정을 불러오지 못했습니다. SQL 테이블 생성 여부와 Supabase 권한을 확인해주세요.');
        } finally {
            setLoading(false);
            setRefreshingLogs(false);
        }
    };

    useEffect(() => {
        void loadData();
    }, []);

    const currentAdminEmail = userProfile?.email || '';

    const handleToggleNotifications = async () => {
        if (!settings) return;

        setSubmitting(true);
        setError(null);

        try {
            const updated = await updateBookingEmailSettings({
                notifications_enabled: !settings.notifications_enabled,
                updated_by_email: currentAdminEmail,
            });
            setSettings(updated);
        } catch (toggleError) {
            console.error('Failed to update booking email setting:', toggleError);
            setError('메일 알림 사용 여부를 저장하지 못했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleAddRecipient = async () => {
        const email = newEmail.trim().toLowerCase();

        if (!email) {
            setError('추가할 이메일 주소를 입력해주세요.');
            return;
        }

        if (!isValidEmail(email)) {
            setError('올바른 이메일 주소 형식이 아닙니다.');
            return;
        }

        if (recipients.some((recipient) => recipient.email.toLowerCase() === email)) {
            setError('이미 등록된 이메일 주소입니다.');
            return;
        }

        setSubmitting(true);
        setError(null);

        try {
            const created = await addBookingEmailRecipient(email, currentAdminEmail);
            setRecipients((prev) => [...prev, created]);
            setNewEmail('');
        } catch (addError) {
            console.error('Failed to add booking email recipient:', addError);
            setError('수신 이메일 추가에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleToggleRecipient = async (recipient: BookingEmailRecipient) => {
        if (!recipient.id) return;

        setSubmitting(true);
        setError(null);

        try {
            const updated = await updateBookingEmailRecipient(recipient.id, {
                is_active: !recipient.is_active,
                updated_by_email: currentAdminEmail,
            });
            setRecipients((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        } catch (updateError) {
            console.error('Failed to update booking email recipient:', updateError);
            setError('수신 이메일 상태 변경에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    const handleDeleteRecipient = async (recipient: BookingEmailRecipient) => {
        if (!recipient.id) return;
        if (!confirm(`${recipient.email} 주소를 삭제하시겠습니까?`)) return;

        setSubmitting(true);
        setError(null);

        try {
            await deleteBookingEmailRecipient(recipient.id);
            setRecipients((prev) => prev.filter((item) => item.id !== recipient.id));
        } catch (deleteError) {
            console.error('Failed to delete booking email recipient:', deleteError);
            setError('수신 이메일 삭제에 실패했습니다.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="animate-spin text-[#39B54A]" size={40} />
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                        <Mail size={24} className="text-[#39B54A]" />
                        견적 메일 설정
                    </h1>
                    <p className="text-sm text-slate-500 mt-1">
                        신규 예약 요청이 들어오면 등록된 운영 이메일로 알림 메일을 보냅니다. 고객에게 자동 회신 메일은 발송하지 않습니다.
                    </p>
                </div>
                <button
                    onClick={() => void loadData(true)}
                    disabled={refreshingLogs || submitting}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60"
                >
                    {refreshingLogs ? <Loader2 size={16} className="animate-spin" /> : <RefreshCcw size={16} />}
                    새로고침
                </button>
            </div>

            {error && (
                <div className="flex items-start gap-3 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                </div>
            )}

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                            {settings?.notifications_enabled ? (
                                <Bell size={18} className="text-[#39B54A]" />
                            ) : (
                                <BellOff size={18} className="text-slate-400" />
                            )}
                            신규 견적 메일 알림
                        </h2>
                        <p className="text-sm text-slate-500">
                            알림을 끄면 예약 요청은 그대로 접수되지만 운영 담당자에게 가는 메일 알림만 중지됩니다.
                        </p>
                        <p className="text-xs text-slate-400">
                            마지막 수정: {formatDateTime(settings?.updated_at)} {settings?.updated_by_email ? `· ${settings.updated_by_email}` : ''}
                        </p>
                    </div>

                    <button
                        onClick={handleToggleNotifications}
                        disabled={submitting}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                            settings?.notifications_enabled
                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                : 'bg-slate-100 text-slate-600 border border-slate-200 hover:bg-slate-200'
                        } disabled:opacity-60`}
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : settings?.notifications_enabled ? <CheckCircle2 size={16} /> : <BellOff size={16} />}
                        {settings?.notifications_enabled ? '발송 사용 중' : '발송 중지됨'}
                    </button>
                </div>
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">수신 이메일 목록</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            여러 운영 담당자를 추가할 수 있고, 주소별로 알림 수신 여부를 따로 관리할 수 있습니다.
                        </p>
                    </div>
                    <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 text-right min-w-[180px]">
                        <div className="text-xs text-slate-500">현재 수신 중</div>
                        <div className="text-2xl font-bold text-slate-800">{activeRecipientCount}</div>
                    </div>
                </div>

                <div className="flex flex-col gap-3 md:flex-row">
                    <input
                        type="email"
                        value={newEmail}
                        onChange={(event) => setNewEmail(event.target.value)}
                        onKeyDown={(event) => {
                            if (event.key === 'Enter') {
                                event.preventDefault();
                                void handleAddRecipient();
                            }
                        }}
                        placeholder="manager@example.com"
                        className="flex-1 rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-[#39B54A] focus:ring-4 focus:ring-[#39B54A]/10"
                    />
                    <button
                        onClick={() => void handleAddRecipient()}
                        disabled={submitting}
                        className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-[#0f2b57] text-white font-semibold hover:bg-[#15356d] transition-all disabled:opacity-60"
                    >
                        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
                        추가
                    </button>
                </div>

                {recipients.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
                        <p className="text-sm font-medium text-slate-500">등록된 수신 이메일이 없습니다.</p>
                        <p className="mt-1 text-xs text-slate-400">최소 한 개 이상 등록해야 관리자 메일을 받을 수 있습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {recipients.map((recipient) => (
                            <div
                                key={recipient.id}
                                className="flex flex-col gap-3 rounded-xl border border-slate-200 px-4 py-4 md:flex-row md:items-center md:justify-between"
                            >
                                <div>
                                    <div className="font-semibold text-slate-800">{recipient.email}</div>
                                    <div className="mt-1 text-xs text-slate-400">
                                        마지막 수정: {formatDateTime(recipient.updated_at || recipient.created_at)} {recipient.updated_by_email ? `· ${recipient.updated_by_email}` : ''}
                                    </div>
                                </div>

                                <div className="flex items-center gap-2">
                                    <span
                                        className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-xs font-semibold ${
                                            recipient.is_active
                                                ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                                : 'bg-slate-100 text-slate-500 border border-slate-200'
                                        }`}
                                    >
                                        {recipient.is_active ? '수신중' : '중지'}
                                    </span>
                                    <button
                                        onClick={() => void handleToggleRecipient(recipient)}
                                        disabled={submitting}
                                        className="rounded-lg border border-slate-200 px-3 py-2 text-sm text-slate-600 hover:bg-slate-50 transition-all disabled:opacity-60"
                                    >
                                        {recipient.is_active ? '중지' : '재개'}
                                    </button>
                                    <button
                                        onClick={() => void handleDeleteRecipient(recipient)}
                                        disabled={submitting}
                                        className="inline-flex items-center justify-center rounded-lg border border-rose-200 px-3 py-2 text-sm text-rose-600 hover:bg-rose-50 transition-all disabled:opacity-60"
                                    >
                                        <Trash2 size={15} />
                                    </button>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </section>

            <section className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <h2 className="text-lg font-semibold text-slate-800">최근 견적 메일 발송 이력</h2>
                        <p className="text-sm text-slate-500 mt-1">
                            최근 20건 기준으로 성공, 실패, 중지 사유를 확인할 수 있습니다.
                        </p>
                    </div>
                </div>

                {logs.length === 0 ? (
                    <div className="rounded-xl border-2 border-dashed border-slate-200 px-6 py-10 text-center">
                        <p className="text-sm font-medium text-slate-500">아직 기록된 발송 이력이 없습니다.</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {logs.map((log) => {
                            const meta = statusMeta[log.status];
                            const StatusIcon = meta.icon;

                            return (
                                <div key={log.id} className="rounded-xl border border-slate-200 px-4 py-4">
                                    <div className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
                                        <div className="space-y-2">
                                            <div className={`inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold ${meta.className}`}>
                                                <StatusIcon size={14} />
                                                {meta.label}
                                            </div>
                                            <div className="font-semibold text-slate-800">{log.product_name || '상품명 없음'}</div>
                                            <div className="text-xs text-slate-400">예약 ID: {log.booking_id || '-'}</div>
                                        </div>
                                        <div className="text-sm text-slate-400">{formatDateTime(log.created_at)}</div>
                                    </div>

                                    <div className="mt-3 space-y-1 text-sm text-slate-600">
                                        <div>예약자 이메일: <span className="font-medium text-slate-800">{log.requester_email || '-'}</span></div>
                                        <div>수신 대상: <span className="font-medium text-slate-800">{log.recipient_emails?.length ? log.recipient_emails.join(', ') : '-'}</span></div>
                                        {log.error_message && (
                                            <div className="text-rose-600">사유: {log.error_message}</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </section>
        </div>
    );
};
