import { useState, useEffect } from 'react';
import { Search, Eye, Trash2, Loader2, X, Building2, Phone, Mail, Calendar, CheckCircle, XCircle, UserCheck, UserX, FileText, Edit2, Save, KeyRound, MapPin } from 'lucide-react';
import { getUsers, deleteUserProfile, searchUsers, updateUserProfile, UserProfile, updateFirebaseEmail, updateFirebasePassword } from '../../src/api/userApi';

export const UserManager = () => {
    const [users, setUsers] = useState<UserProfile[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const [approving, setApproving] = useState<string | null>(null);
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState<Partial<UserProfile>>({});
    const [saving, setSaving] = useState(false);
    const [newPassword, setNewPassword] = useState('');
    const [changingPassword, setChangingPassword] = useState(false);

    useEffect(() => {
        loadUsers();
    }, []);

    const loadUsers = async () => {
        try {
            setLoading(true);
            const data = await getUsers();
            setUsers(data);
        } catch (error) {
            console.error('Failed to load users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSearch = async () => {
        if (!searchQuery.trim()) {
            loadUsers();
            return;
        }
        try {
            setLoading(true);
            const data = await searchUsers(searchQuery);
            setUsers(data);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleApproval = async (id: string, approve: boolean) => {
        setApproving(id);
        try {
            const result = await updateUserProfile(id, { is_approved: approve });
            console.log('Approval update result:', result);

            if (result && result.is_approved === approve) {
                setUsers(users.map(u => u.id === id ? { ...u, is_approved: approve } : u));
                if (selectedUser?.id === id) {
                    setSelectedUser({ ...selectedUser, is_approved: approve });
                }
                alert(approve ? '회원이 승인되었습니다.' : '승인이 취소되었습니다.');
            } else {
                console.error('Approval status mismatch:', result);
                alert('승인 상태 변경이 반영되지 않았습니다. Supabase에 is_approved 컬럼이 있는지 확인해주세요.');
            }
        } catch (error) {
            console.error('Failed to update approval:', error);
            alert('승인 상태 변경에 실패했습니다: ' + (error as Error).message);
        } finally {
            setApproving(null);
        }
    };

    const handleAdminToggle = async (id: string, isAdmin: boolean) => {
        try {
            await updateUserProfile(id, { is_admin: isAdmin });
            setUsers(users.map(u => u.id === id ? { ...u, is_admin: isAdmin } : u));
            if (selectedUser?.id === id) {
                setSelectedUser({ ...selectedUser, is_admin: isAdmin });
            }
        } catch (error) {
            console.error('Failed to update admin status:', error);
            alert('관리자 상태 변경에 실패했습니다.');
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('정말 이 회원을 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) return;

        setDeleting(id);
        try {
            await deleteUserProfile(id);
            setUsers(users.filter(u => u.id !== id));
            if (selectedUser?.id === id) setSelectedUser(null);
        } catch (error) {
            console.error('Failed to delete user:', error);
            alert('회원 삭제에 실패했습니다.');
        } finally {
            setDeleting(null);
        }
    };

    const openEditMode = () => {
        if (selectedUser) {
            setEditData({
                email: selectedUser.email,
                name: selectedUser.name,
                phone: selectedUser.phone,
                company_name: selectedUser.company_name,
                department: selectedUser.department || '',
                position: selectedUser.position || '',
                business_number: selectedUser.business_number || '',
                address: selectedUser.address || ''
            });
            setEditMode(true);
        }
    };

    const handlePasswordChange = async () => {
        if (!selectedUser?.firebase_uid) {
            alert('Firebase UID가 없습니다.');
            return;
        }
        if (!newPassword || newPassword.length < 6) {
            alert('비밀번호는 최소 6자 이상이어야 합니다.');
            return;
        }
        if (!confirm('정말 비밀번호를 변경하시겠습니까?')) return;

        setChangingPassword(true);
        try {
            await updateFirebasePassword(selectedUser.firebase_uid, newPassword);
            setNewPassword('');
            alert('비밀번호가 변경되었습니다.');
        } catch (error: any) {
            console.error('Password change failed:', error);
            alert('비밀번호 변경에 실패했습니다: ' + error.message);
        } finally {
            setChangingPassword(false);
        }
    };

    const handleSaveEdit = async () => {
        if (!selectedUser?.id) return;

        setSaving(true);
        try {
            // 이메일이 변경된 경우 Firebase Auth도 업데이트
            if (editData.email && editData.email !== selectedUser.email) {
                if (!selectedUser.firebase_uid) {
                    throw new Error('Firebase UID가 없어 이메일을 변경할 수 없습니다.');
                }
                await updateFirebaseEmail(selectedUser.firebase_uid, editData.email);
            }

            // Supabase 프로필 업데이트
            await updateUserProfile(selectedUser.id, editData);
            const updatedUser = { ...selectedUser, ...editData };
            setSelectedUser(updatedUser);
            setUsers(users.map(u => u.id === selectedUser.id ? updatedUser : u));
            setEditMode(false);
            alert('회원 정보가 수정되었습니다.');
        } catch (error) {
            console.error('Failed to save user:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const formatDate = (dateString?: string) => {
        if (!dateString) return '-';
        return new Date(dateString).toLocaleDateString('ko-KR', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });
    };

    const approvedCount = users.filter(u => u.is_approved).length;
    const pendingCount = users.filter(u => !u.is_approved).length;

    if (loading && users.length === 0) {
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
                    <h2 className="text-2xl font-bold text-slate-800">회원 관리</h2>
                    <p className="text-slate-500 text-sm mt-1">
                        총 {users.length}명 (승인됨: {approvedCount}, 대기중: {pendingCount})
                    </p>
                </div>
            </div>

            {/* Search Bar */}
            <div className="bg-white rounded-xl shadow-md p-4 mb-6">
                <div className="flex gap-3">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <input
                            type="text"
                            placeholder="이름, 이메일, 회사명으로 검색"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                            className="w-full pl-10 pr-4 py-2.5 border border-slate-200 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                        />
                    </div>
                    <button onClick={handleSearch} className="px-6 py-2.5 bg-[#FF5B60] text-white rounded-lg hover:bg-[#002d66] transition-colors">
                        검색
                    </button>
                    {searchQuery && (
                        <button onClick={() => { setSearchQuery(''); loadUsers(); }} className="px-4 py-2.5 border border-slate-200 rounded-lg hover:bg-slate-50">
                            초기화
                        </button>
                    )}
                </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-xl shadow-md overflow-hidden">
                <table className="w-full">
                    <thead className="bg-slate-50 border-b">
                        <tr>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">회원정보</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">회사/단체</th>
                            <th className="text-left px-4 py-3 text-sm font-semibold text-slate-600">연락처</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">승인상태</th>
                            <th className="text-center px-4 py-3 text-sm font-semibold text-slate-600">작업</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {users.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-400">
                                    {searchQuery ? '검색 결과가 없습니다.' : '등록된 회원이 없습니다.'}
                                </td>
                            </tr>
                        ) : (
                            users.map((user) => (
                                <tr key={user.id} className={`hover:bg-slate-50 ${!user.is_approved ? 'bg-amber-50/50' : ''}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${user.is_approved ? 'bg-gradient-to-br from-[#FF5B60] to-[#003366]' : 'bg-slate-400'}`}>
                                                {user.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-slate-800 flex items-center gap-2">
                                                    {user.name}
                                                    {user.is_admin && (
                                                        <span className="px-1.5 py-0.5 bg-purple-100 text-purple-600 text-xs rounded font-medium">관리자</span>
                                                    )}
                                                </div>
                                                <div className="text-sm text-slate-500">{user.email}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-slate-800">{user.company_name}</div>
                                        {user.business_number && (
                                            <div className="text-sm text-slate-500">사업자: {user.business_number}</div>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-slate-600">{user.phone}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center">
                                            {user.is_approved ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                                                    <CheckCircle size={14} /> 승인됨
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-100 text-amber-700 rounded-full text-xs font-medium">
                                                    <XCircle size={14} /> 대기중
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {!user.is_approved ? (
                                                <button
                                                    onClick={() => handleApproval(user.id!, true)}
                                                    disabled={approving === user.id}
                                                    className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="승인"
                                                >
                                                    {approving === user.id ? <Loader2 size={18} className="animate-spin" /> : <UserCheck size={18} />}
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleApproval(user.id!, false)}
                                                    disabled={approving === user.id}
                                                    className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors disabled:opacity-50"
                                                    title="승인 취소"
                                                >
                                                    {approving === user.id ? <Loader2 size={18} className="animate-spin" /> : <UserX size={18} />}
                                                </button>
                                            )}
                                            <button onClick={() => { setSelectedUser(user); setEditMode(false); }} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="상세보기">
                                                <Eye size={18} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(user.id!)}
                                                disabled={deleting === user.id}
                                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                                                title="삭제"
                                            >
                                                {deleting === user.id ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>

            {/* User Detail/Edit Modal */}
            {selectedUser && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
                        <div className="flex items-center justify-between p-4 border-b sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-bold">{editMode ? '회원 정보 수정' : '회원 상세정보'}</h3>
                            <div className="flex items-center gap-2">
                                {!editMode && (
                                    <button onClick={openEditMode} className="p-2 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors" title="수정">
                                        <Edit2 size={20} />
                                    </button>
                                )}
                                <button onClick={() => { setSelectedUser(null); setEditMode(false); }} className="text-slate-400 hover:text-slate-600">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        <div className="p-6 space-y-4">
                            {/* Approval Status Banner */}
                            <div className={`p-3 rounded-lg flex items-center justify-between ${selectedUser.is_approved ? 'bg-green-50 border border-green-200' : 'bg-amber-50 border border-amber-200'}`}>
                                <div className="flex items-center gap-2">
                                    {selectedUser.is_approved ? (
                                        <>
                                            <CheckCircle className="text-green-600" size={20} />
                                            <span className="font-medium text-green-700">승인된 회원</span>
                                        </>
                                    ) : (
                                        <>
                                            <XCircle className="text-amber-600" size={20} />
                                            <span className="font-medium text-amber-700">승인 대기중</span>
                                        </>
                                    )}
                                </div>
                                <button
                                    onClick={() => handleApproval(selectedUser.id!, !selectedUser.is_approved)}
                                    className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${selectedUser.is_approved ? 'bg-amber-100 text-amber-700 hover:bg-amber-200' : 'bg-green-600 text-white hover:bg-green-700'
                                        }`}
                                >
                                    {selectedUser.is_approved ? '승인 취소' : '승인하기'}
                                </button>
                            </div>

                            {editMode ? (
                                /* Edit Form */
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">이름</label>
                                        <input
                                            type="text"
                                            value={editData.name || ''}
                                            onChange={(e) => setEditData({ ...editData, name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">이메일 (아이디)</label>
                                        <input
                                            type="email"
                                            value={editData.email || ''}
                                            onChange={(e) => setEditData({ ...editData, email: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                        />
                                        <p className="text-xs text-green-600 mt-1">※ 이메일 변경 시 Firebase 로그인 아이디도 함께 변경됩니다.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">새 비밀번호</label>
                                        <div className="flex gap-2">
                                            <input
                                                type="password"
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="새 비밀번호 (최소 6자)"
                                                className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={handlePasswordChange}
                                                disabled={changingPassword || !newPassword}
                                                className="px-4 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                                            >
                                                {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <KeyRound size={16} />}
                                                변경
                                            </button>
                                        </div>
                                        <p className="text-xs text-slate-500 mt-1">비밀번호를 직접 변경합니다.</p>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">전화번호</label>
                                        <input
                                            type="tel"
                                            value={editData.phone || ''}
                                            onChange={(e) => setEditData({ ...editData, phone: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">회사/단체명</label>
                                        <input
                                            type="text"
                                            value={editData.company_name || ''}
                                            onChange={(e) => setEditData({ ...editData, company_name: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">부서</label>
                                            <input
                                                type="text"
                                                value={editData.department || ''}
                                                onChange={(e) => setEditData({ ...editData, department: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-slate-700 mb-1">직책</label>
                                            <input
                                                type="text"
                                                value={editData.position || ''}
                                                onChange={(e) => setEditData({ ...editData, position: e.target.value })}
                                                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">사업자등록번호</label>
                                        <input
                                            type="text"
                                            value={editData.business_number || ''}
                                            onChange={(e) => setEditData({ ...editData, business_number: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-700 mb-1">주소</label>
                                        <input
                                            type="text"
                                            value={editData.address || ''}
                                            onChange={(e) => setEditData({ ...editData, address: e.target.value })}
                                            className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none"
                                        />
                                    </div>
                                </div>
                            ) : (
                                /* View Mode */
                                <>
                                    <div className="flex items-center gap-4 pb-4 border-b">
                                        <div className={`w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold ${selectedUser.is_approved ? 'bg-gradient-to-br from-[#FF5B60] to-[#003366]' : 'bg-slate-400'}`}>
                                            {selectedUser.name.charAt(0)}
                                        </div>
                                        <div>
                                            <div className="text-xl font-bold text-slate-800 flex items-center gap-2">
                                                {selectedUser.name}
                                                {selectedUser.is_admin && (
                                                    <span className="px-2 py-0.5 bg-purple-100 text-purple-600 text-xs rounded font-medium">관리자</span>
                                                )}
                                            </div>
                                            <div className="text-slate-500">{selectedUser.company_name}</div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Mail size={18} className="text-slate-400" />
                                            <span>{selectedUser.email}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Phone size={18} className="text-slate-400" />
                                            <span>{selectedUser.phone}</span>
                                        </div>
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Building2 size={18} className="text-slate-400" />
                                            <span>
                                                {selectedUser.company_name}
                                                {(selectedUser.department || selectedUser.position) && (
                                                    <span className="text-slate-400 ml-2">
                                                        ({[selectedUser.department, selectedUser.position].filter(Boolean).join(' / ')})
                                                    </span>
                                                )}
                                            </span>
                                        </div>
                                        {selectedUser.business_number && (
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <FileText size={18} className="text-slate-400" />
                                                <span>사업자등록번호: {selectedUser.business_number}</span>
                                            </div>
                                        )}
                                        {selectedUser.business_license_url && (
                                            <div className="flex items-center gap-3 text-slate-600">
                                                <FileText size={18} className="text-slate-400" />
                                                <a href={selectedUser.business_license_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                                                    사업자등록증 보기
                                                </a>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 text-slate-600">
                                            <Calendar size={18} className="text-slate-400" />
                                            <span>가입일: {formatDate(selectedUser.created_at)}</span>
                                        </div>
                                    </div>

                                    {/* Admin Toggle */}
                                    <div className="pt-4 border-t">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <h4 className="font-medium text-slate-800">관리자 권한</h4>
                                                <p className="text-sm text-slate-500">관리자 대시보드 접근 권한을 부여합니다</p>
                                            </div>
                                            <button
                                                onClick={() => handleAdminToggle(selectedUser.id!, !selectedUser.is_admin)}
                                                className={`relative w-14 h-7 rounded-full transition-colors ${selectedUser.is_admin ? 'bg-purple-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${selectedUser.is_admin ? 'translate-x-7' : ''}`} />
                                            </button>
                                        </div>
                                    </div>

                                    {/* Consent Status */}
                                    <div className="pt-4 border-t">
                                        <h4 className="text-sm font-semibold text-slate-700 mb-3">동의 현황</h4>
                                        <div className="space-y-2 text-sm">
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600">이용약관</span>
                                                <span className={selectedUser.agreed_terms ? 'text-green-600' : 'text-red-500'}>
                                                    {selectedUser.agreed_terms ? '동의함' : '미동의'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600">개인정보 처리방침</span>
                                                <span className={selectedUser.agreed_privacy ? 'text-green-600' : 'text-red-500'}>
                                                    {selectedUser.agreed_privacy ? '동의함' : '미동의'}
                                                </span>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <span className="text-slate-600">마케팅 정보 수신</span>
                                                <span className={selectedUser.agreed_marketing ? 'text-green-600' : 'text-slate-400'}>
                                                    {selectedUser.agreed_marketing ? '동의함' : '미동의'}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        <div className="p-4 border-t bg-slate-50 flex justify-end gap-3 sticky bottom-0">
                            {editMode ? (
                                <>
                                    <button onClick={() => setEditMode(false)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                                        취소
                                    </button>
                                    <button
                                        onClick={handleSaveEdit}
                                        disabled={saving}
                                        className="px-4 py-2 bg-[#001E45] text-white rounded-lg hover:bg-[#002d66] transition-colors flex items-center gap-2 disabled:opacity-50"
                                    >
                                        {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
                                        저장
                                    </button>
                                </>
                            ) : (
                                <>
                                    <button onClick={() => setSelectedUser(null)} className="px-4 py-2 border border-slate-300 rounded-lg hover:bg-slate-100 transition-colors">
                                        닫기
                                    </button>
                                    <button onClick={() => handleDelete(selectedUser.id!)} className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors">
                                        회원 삭제
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
