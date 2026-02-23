import React, { useState } from 'react';
import { generateVerificationCode, sendVerificationEmail } from '../src/utils/email';
import { Container } from '../components/ui/Container';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronDown, ChevronUp, Check, Loader2, Upload, X } from 'lucide-react';

import { auth } from '../src/firebase';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { createUserProfile } from '../src/api/userApi';
import { uploadImage } from '../src/api/storageApi';
import { getAuthErrorMessage } from '../src/utils/authErrors';

// 약관 내용
const TERMS_CONTENT = `제1조 (목적)
본 약관은 행사어때 플랫폼(이하 "서비스")의 이용과 관련하여 운영 주체와 이용자 간의 권리, 의무 및 책임사항을 규정함을 목적으로 합니다.

제2조 (정의)
1. "이용자"란 본 약관에 따라 서비스를 이용하는 회원 및 비회원을 말합니다.
2. "회원"이란 서비스에 가입하여 지속적으로 서비스를 이용하는 자를 말합니다.
3. "파트너"란 서비스에 입점하여 행사 장비, 공간, 운영 인력 또는 관련 서비스를 제공하는 사업자 또는 개인을 말합니다.
4. "예약"이란 이용자가 상품/서비스 이용 의사를 표시하고 확인 절차를 거쳐 거래가 성립되는 행위를 말합니다.

제3조 (약관의 효력 및 변경)
1. 약관은 서비스 화면에 게시하거나 기타 방법으로 공지함으로써 효력이 발생합니다.
2. 운영 주체는 관련 법령을 위반하지 않는 범위에서 약관을 변경할 수 있습니다.
3. 이용자에게 불리한 변경은 사전에 공지하며, 계속 이용 시 변경 약관에 동의한 것으로 봅니다.

제4조 (회원가입 및 계정관리)
1. 회원가입은 이용자가 약관에 동의하고 가입 절차를 완료한 후 승인됨으로써 성립합니다.
2. 이용자는 정확한 정보를 제공해야 하며, 계정 관리 책임은 회원 본인에게 있습니다.
3. 계정 도용 등 이상 징후 발견 시 즉시 운영 주체에 통지해야 합니다.

제5조 (서비스 제공 및 운영)
1. 서비스는 행사 관련 상품 탐색, 예약 요청, 상담 연결, 결제 지원 등의 기능을 제공합니다.
2. 서비스 범위와 운영 방식은 정책, 기술적 사정, 파트너 운영 사정에 따라 변경될 수 있습니다.

제6조 (예약, 계약의 성립 및 플랫폼의 지위)
1. 예약 요청은 파트너 수락 또는 확인 절차 완료 시점에 확정됩니다.
2. 별도 고지가 없는 한 서비스는 이용자와 파트너 간 거래를 중개하는 플랫폼입니다.

제7조 (요금, 결제, 취소 및 환불)
1. 최종 결제 금액은 부가세, 옵션, 지역/시간 추가 비용 등에 따라 달라질 수 있습니다.
2. 취소 및 환불 기준은 관련 법령, 본 약관, 파트너별 환불 규정, 상품별 개별 조건을 따릅니다.

제8조 (면책)
천재지변, 통신장애, 제3자 서비스 장애, 파트너 귀책 등 통제 범위를 벗어난 사유로 발생한 손해에 대해서는 책임이 제한될 수 있습니다.

부칙
본 약관은 2026년 2월 6일부터 시행합니다.`;

const PRIVACY_CONTENT = `1. 총칙
본 개인정보처리방침은 행사어때 플랫폼의 서비스 이용 과정에서 처리되는 개인정보의 기준을 안내합니다.
플랫폼은 현재 서비스 준비 단계이며, 향후 "micepartner" 법인 설립 이후 해당 법인이 개인정보처리자로서 본 방침을 승계·운영할 수 있습니다.

2. 수집하는 개인정보 항목
- 회원가입 및 계정관리: 이름, 이메일, 비밀번호, 휴대전화번호
- 예약/상담/문의: 행사명, 행사 일정, 행사 지역, 요청사항, 문의 내용, 첨부파일(선택)
- 결제 및 정산: 결제수단 정보, 거래 기록, 환불 계좌 정보(환불 시)
- 서비스 이용기록: 접속 로그, IP 주소, 기기/브라우저 정보, 쿠키, 이용 이력

3. 개인정보의 수집 및 이용 목적
- 회원 식별, 본인확인, 계정 보안, 부정 이용 방지
- 예약 접수, 상담 진행, 계약 이행, 고객지원
- 결제 처리, 환불 처리, 정산 및 민원 처리
- 서비스 품질 개선, 통계 분석, 장애 대응, 보안 모니터링
- 이벤트/프로모션 안내(별도 동의한 경우)

4. 개인정보의 보유 및 이용 기간
개인정보 수집·이용 목적이 달성되면 지체 없이 파기합니다.
단, 관련 법령에 따라 다음과 같이 보관할 수 있습니다.
- 계약 또는 청약철회 등에 관한 기록: 5년
- 대금결제 및 재화/서비스 공급에 관한 기록: 5년
- 소비자 불만 또는 분쟁처리에 관한 기록: 3년
- 웹사이트 접속기록: 3개월

5. 개인정보의 제3자 제공
원칙적으로 개인정보를 외부에 제공하지 않습니다.
다만, 예약/계약 이행을 위해 필요한 경우 또는 법령에 근거가 있는 경우 최소한의 범위에서 제공할 수 있습니다.

6. 개인정보 처리위탁
클라우드 인프라, 이메일 발송, 결제 처리, 고객문의 관리 등 일부 업무를 외부에 위탁할 수 있습니다.
위탁 시 관련 법령에 따라 안전하게 관리되도록 감독합니다.

7. 개인정보의 파기 절차 및 방법
파기 사유가 발생한 개인정보는 관련 법령 및 내부 방침에 따라 파기합니다.
전자 파일은 복구 불가능한 방식으로 삭제하며, 종이 문서는 분쇄 또는 소각합니다.

8. 정보주체의 권리 및 행사 방법
이용자는 개인정보 열람, 정정, 삭제, 처리정지 요청을 할 수 있습니다.
회원 탈퇴를 통해 동의를 철회할 수 있으며, 법령상 보존 의무가 없는 정보는 지체 없이 파기됩니다.

9. 개인정보 보호책임자
- 성명: 이기섭
- 연락처: 010-4074-6967
- 이메일: hm_solution@naver.com
상기 연락처는 법인 설립 전 임시 운영 연락처이며, micepartner 법인 설립 후 변경 시 즉시 고지합니다.

10. 고지의 의무
본 방침의 내용 추가, 삭제 및 수정이 있는 경우 시행일 최소 7일 전에 공지합니다.
이용자 권리에 중대한 변경이 있는 경우 시행일 최소 30일 전에 공지합니다.

부칙
본 개인정보처리방침은 2026년 2월 6일부터 시행합니다.`;

const MARKETING_CONTENT = `마케팅 정보 수신에 동의하시면 행사어때의 다양한 혜택과 이벤트, 신규 서비스 소식을 받아보실 수 있습니다.

- 이메일 및 문자(SMS)를 통한 이벤트/프로모션 안내
- 신규 서비스 및 기능 업데이트 소식 안내
- 이용 패턴 기반 맞춤형 추천 정보 제공

마케팅 정보 수신 동의는 선택 사항이며, 동의하지 않아도 서비스 이용에는 제한이 없습니다.
동의 후에도 마이페이지 또는 수신거부 경로를 통해 언제든지 철회할 수 있습니다.`;

// 접이식 약관 컴포넌트
const AgreementSection = ({
    title,
    content,
    checked,
    onChange,
    required = false
}: {
    title: string;
    content: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    required?: boolean;
}) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="border border-gray-200 rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 bg-gray-50">
                <label className="flex items-center gap-3 cursor-pointer flex-1">
                    <div
                        className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${checked
                            ? 'bg-[#FF5B60] border-[#FF5B60]'
                            : 'border-gray-300 bg-white'
                            }`}
                        onClick={() => onChange(!checked)}
                    >
                        {checked && <Check size={14} className="text-white" />}
                    </div>
                    <span className="text-sm font-medium text-gray-700">
                        {required && <span className="text-red-500 mr-1">*</span>}
                        {title}
                    </span>
                </label>
                <button
                    type="button"
                    onClick={() => setIsOpen(!isOpen)}
                    className="p-1 text-gray-500 hover:text-gray-700"
                >
                    {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                </button>
            </div>
            {isOpen && (
                <div className="p-4 bg-white border-t border-gray-200 max-h-48 overflow-y-auto">
                    <pre className="text-xs text-gray-600 whitespace-pre-wrap font-sans leading-relaxed">
                        {content}
                    </pre>
                </div>
            )}
        </div>
    );
};

export const SignUp: React.FC = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    
    // 회원 유형: 'business' (일반기업) 또는 'public' (공공기관)
    const [memberType, setMemberType] = useState<'business' | 'public'>('business');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
        phone: '',
        companyName: '',
        department: '',
        position: '',
        address: '',
        businessNumber: '',
        businessLicenseUrl: '',
        // 공공기관 전용 필드
        institutionName: '',
        managerName: ''
    });

    // 이메일 인증 상태
    const [verificationCode, setVerificationCode] = useState(''); // 실제 발송된 코드
    const [inputCode, setInputCode] = useState(''); // 사용자가 입력한 코드
    const [isEmailVerified, setIsEmailVerified] = useState(false); // 인증 완료 여부
    const [isCodeSent, setIsCodeSent] = useState(false); // 코드 발송 여부
    const [verifying, setVerifying] = useState(false); // 발송 중 상태

    const [agreements, setAgreements] = useState({
        terms: false,
        privacy: false,
        marketing: false
    });

    const [uploadingLicense, setUploadingLicense] = useState(false);

    const allRequiredAgreed = agreements.terms && agreements.privacy;
    const allAgreed = agreements.terms && agreements.privacy && agreements.marketing;

    const handleAllAgree = (checked: boolean) => {
        setAgreements({
            terms: checked,
            privacy: checked,
            marketing: checked
        });
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });

        // 이메일 변경 시 인증 상태 초기화
        if (e.target.name === 'email') {
            setIsEmailVerified(false);
            setIsCodeSent(false);
            setVerificationCode('');
            setInputCode('');
        }
    };

    const formatPhoneNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 7) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 7)}-${numbers.slice(7, 11)}`;
    };

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatPhoneNumber(e.target.value);
        setFormData({ ...formData, phone: formatted });
    };

    const formatBusinessNumber = (value: string) => {
        const numbers = value.replace(/\D/g, '');
        if (numbers.length <= 3) return numbers;
        if (numbers.length <= 5) return `${numbers.slice(0, 3)}-${numbers.slice(3)}`;
        return `${numbers.slice(0, 3)}-${numbers.slice(3, 5)}-${numbers.slice(5, 10)}`;
    };

    const handleBusinessNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const formatted = formatBusinessNumber(e.target.value);
        setFormData({ ...formData, businessNumber: formatted });
    };

    const handleLicenseUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/') && file.type !== 'application/pdf') {
            alert('이미지 또는 PDF 파일만 업로드할 수 있습니다.');
            return;
        }

        if (file.size > 10 * 1024 * 1024) {
            alert('파일 크기는 10MB 이하여야 합니다.');
            return;
        }

        setUploadingLicense(true);
        try {
            const url = await uploadImage(file, 'business-licenses');
            setFormData({ ...formData, businessLicenseUrl: url });
        } catch (error) {
            console.error('License upload failed:', error);
            alert('파일 업로드에 실패했습니다.');
        } finally {
            setUploadingLicense(false);
        }
    };

    // 이메일 인증번호 발송 핸들러
    const handleSendVerification = async () => {
        if (!formData.email) {
            alert('이메일을 입력해주세요.');
            return;
        }

        if (formData.email === 'example@company.com' || !formData.email.includes('@')) {
            alert('유효한 이메일을 입력해주세요.');
            return;
        }

        setVerifying(true);
        const code = generateVerificationCode();
        setVerificationCode(code);

        try {
            await sendVerificationEmail(formData.name || '고객', formData.email, code);
            setIsCodeSent(true);
            alert('인증번호가 발송되었습니다.');
        } catch (error) {
            alert('인증번호 발송에 실패했습니다.');
        } finally {
            setVerifying(false);
        }
    };

    // 인증번호 확인 핸들러
    const handleVerifyCode = () => {
        if (inputCode === verificationCode && inputCode.length === 6) {
            setIsEmailVerified(true);
            alert('이메일 인증이 완료되었습니다.');
        } else {
            alert('인증번호가 올바르지 않습니다.');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!isEmailVerified) {
            alert('이메일 인증을 완료해주세요.');
            return;
        }

        if (formData.password !== formData.confirmPassword) {
            alert('비밀번호가 일치하지 않습니다.');
            return;
        }

        if (formData.password.length < 8) {
            alert('비밀번호는 8자 이상이어야 합니다.');
            return;
        }

        if (!allRequiredAgreed) {
            alert('필수 약관에 동의해주세요.');
            return;
        }

        // 일반기업일 경우에만 사업자 정보 검증
        if (memberType === 'business') {
            if (!formData.businessNumber || formData.businessNumber.replace(/-/g, '').length !== 10) {
                alert('사업자등록번호를 올바르게 입력해주세요.');
                return;
            }

            if (!formData.businessLicenseUrl) {
                alert('사업자등록증을 업로드해주세요.');
                return;
            }
        }
        
        // 공공기관일 경우 기관명, 담당자명 검증
        if (memberType === 'public') {
            if (!formData.institutionName) {
                alert('기관명을 입력해주세요.');
                return;
            }
            if (!formData.managerName) {
                alert('담당자 성함을 입력해주세요.');
                return;
            }
        }

        setLoading(true);
        try {
            // 1. Firebase Auth 회원가입
            const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
            await updateProfile(userCredential.user, {
                displayName: formData.name
            });

            // 2. Supabase에 프로필 저장
            await createUserProfile({
                firebase_uid: userCredential.user.uid,
                email: formData.email,
                name: formData.name,
                phone: formData.phone,
                company_name: memberType === 'business' ? formData.companyName : formData.institutionName,
                department: memberType === 'business' ? (formData.department || undefined) : undefined,
                position: memberType === 'business' ? (formData.position || undefined) : undefined,
                address: memberType === 'business' ? (formData.address || undefined) : undefined,
                business_number: memberType === 'business' ? (formData.businessNumber || undefined) : undefined,
                business_license_url: memberType === 'business' ? (formData.businessLicenseUrl || undefined) : undefined,
                member_type: memberType,
                manager_name: memberType === 'public' ? formData.managerName : undefined,
                is_approved: false,
                agreed_terms: agreements.terms,
                agreed_privacy: agreements.privacy,
                agreed_marketing: agreements.marketing
            });

            alert('가입 신청이 완료되었습니다. 관리자 승인 후 이용 가능합니다.');
            navigate('/login');
        } catch (error: any) {
            console.error('Sign up failed', error);
            const message = getAuthErrorMessage(error.code);
            alert('회원가입에 실패했습니다: ' + message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="py-12 bg-gray-50 min-h-screen">
            <Container>
                <div className="max-w-lg mx-auto bg-white p-4 md:p-8 rounded-2xl shadow-sm border border-gray-100">
                    <div className="text-center mb-8">
                        <h1 className="text-2xl font-bold text-gray-900">회원가입</h1>
                        <p className="text-gray-500 text-sm mt-2">행사어때의 회원이 되어 다양한 혜택을 누리세요.</p>
                    </div>

                    {/* 회원 유형 선택 */}
                    <div className="mb-6">
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setMemberType('business')}
                                className={`py-4 px-4 rounded-xl border-2 transition-all font-medium text-center ${
                                    memberType === 'business'
                                        ? 'border-[#FF5B60] bg-[#FF5B60]/5 text-[#FF5B60]'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-lg mb-1">🏢</div>
                                <div className="text-sm font-bold">일반 기업</div>
                                <div className="text-xs text-gray-400 mt-0.5">B2B 고객</div>
                            </button>
                            <button
                                type="button"
                                onClick={() => setMemberType('public')}
                                className={`py-4 px-4 rounded-xl border-2 transition-all font-medium text-center ${
                                    memberType === 'public'
                                        ? 'border-[#FF5B60] bg-[#FF5B60]/5 text-[#FF5B60]'
                                        : 'border-gray-200 bg-white text-gray-600 hover:border-gray-300'
                                }`}
                            >
                                <div className="text-lg mb-1">🏛️</div>
                                <div className="text-sm font-bold">공공기관</div>
                                <div className="text-xs text-gray-400 mt-0.5">관공서/공기업</div>
                            </button>
                        </div>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* 기본 정보 */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">기본 정보</h3>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">이름 <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    name="name"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                    placeholder="이름을 입력하세요"
                                    value={formData.name}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    이메일<span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                    placeholder="example@company.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    readOnly={isEmailVerified}
                                />
                                {!isEmailVerified && (
                                    <button
                                        type="button"
                                        onClick={handleSendVerification}
                                        disabled={verifying || isCodeSent}
                                        className={`w-full mt-2 py-3 rounded-lg font-bold text-sm transition-all border ${isCodeSent
                                            ? 'bg-gray-100 text-gray-400 border-gray-200'
                                            : 'bg-white text-[#FF5B60] border-[#FF5B60] hover:bg-[#FF5B60] hover:text-white'
                                            }`}
                                    >
                                        {verifying ? (
                                            <div className="flex items-center justify-center gap-2">
                                                <Loader2 className="animate-spin" size={16} />
                                                <span>발송 중...</span>
                                            </div>
                                        ) : isCodeSent ? '인증번호 재발송' : '인증번호 발송'}
                                    </button>
                                )}
                            </div>

                            {/* 인증번호 입력란 (발송되었고 아직 인증 안됐을 때 표시) */}
                            {isCodeSent && !isEmailVerified && (
                                <div className="mt-2 animate-fadeIn p-4 bg-gray-50 rounded-lg border border-gray-200">
                                    <label className="block text-xs font-semibold text-gray-700 mb-1">
                                        인증번호 입력
                                    </label>
                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2 rounded border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] outline-none text-sm"
                                            placeholder="6자리 숫자"
                                            value={inputCode}
                                            onChange={(e) => setInputCode(e.target.value)}
                                            maxLength={6}
                                        />
                                        <button
                                            type="button"
                                            onClick={handleVerifyCode}
                                            className="px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-700 text-sm font-medium whitespace-nowrap"
                                        >
                                            확인
                                        </button>
                                    </div>
                                </div>
                            )}

                            {isEmailVerified && (
                                <div className="mt-2 flex items-center gap-2 text-green-600 text-sm font-medium bg-green-50 p-3 rounded border border-green-100">
                                    <Check size={16} />
                                    <span>이메일 인증이 완료되었습니다.</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    전화번호 <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="tel"
                                    name="phone"
                                    required
                                    className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                    placeholder="010-1234-5678"
                                    value={formData.phone}
                                    onChange={handlePhoneChange}
                                    maxLength={13}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        비밀번호 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="password"
                                        required
                                        minLength={8}
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="8자 이상"
                                        value={formData.password}
                                        onChange={handleChange}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        비밀번호 확인 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="password"
                                        name="confirmPassword"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="비밀번호 확인"
                                        value={formData.confirmPassword}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* 일반 기업 회원 정보 */}
                        {memberType === 'business' && (
                            <div className="space-y-4 pt-2">
                                <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">회사/단체 정보</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        회사/단체명<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="companyName"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="(주)휴먼파트너"
                                        value={formData.companyName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            부서명 <span className="text-gray-400 text-xs">(선택)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="department"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                            placeholder="기획팀"
                                            value={formData.department}
                                            onChange={handleChange}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            직책 <span className="text-gray-400 text-xs">(선택)</span>
                                        </label>
                                        <input
                                            type="text"
                                            name="position"
                                            className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                            placeholder="대리"
                                            value={formData.position}
                                            onChange={handleChange}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        배송주소 <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="address"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="서울시 강남구 테헤란로 123 OO빌딩 4층"
                                        value={formData.address}
                                        onChange={handleChange}
                                    />
                                </div>

                                {/* 사업자등록 정보 */}
                                <div className="pt-3">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        사업자등록번호<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="businessNumber"
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="000-00-00000"
                                        value={formData.businessNumber}
                                        onChange={handleBusinessNumberChange}
                                        maxLength={12}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        사업자등록증 <span className="text-red-500">*</span>
                                    </label>
                                    {formData.businessLicenseUrl ? (
                                        <div className="relative border border-gray-200 rounded-lg p-3 bg-gray-50">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <Check size={18} className="text-green-500" />
                                                    <span className="text-sm text-gray-700">사업자등록증이 업로드되었습니다</span>
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, businessLicenseUrl: '' })}
                                                    className="p-1 text-red-500 hover:bg-red-50 rounded"
                                                >
                                                    <X size={18} />
                                                </button>
                                            </div>
                                        </div>
                                    ) : (
                                        <label className="block">
                                            <div className={`border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-[#FF5B60] hover:bg-gray-50 transition-colors ${uploadingLicense ? 'opacity-50 pointer-events-none' : ''}`}>
                                                {uploadingLicense ? (
                                                    <div className="flex flex-col items-center">
                                                        <Loader2 className="animate-spin text-[#FF5B60]" size={24} />
                                                        <span className="text-sm text-gray-500 mt-2">업로드 중...</span>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <Upload className="text-gray-400" size={24} />
                                                        <span className="text-sm text-gray-500 mt-2">클릭하여 파일 선택</span>
                                                        <span className="text-xs text-gray-400 mt-1">이미지 또는 PDF (최대 10MB)</span>
                                                    </div>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept="image/*,.pdf"
                                                onChange={handleLicenseUpload}
                                                className="hidden"
                                            />
                                        </label>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* 공공기관 회원 정보 */}
                        {memberType === 'public' && (
                            <div className="space-y-4 pt-2">
                                <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">공공기관 정보</h3>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        기관명<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="institutionName"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="서울특별시청, 한국전력공사 등"
                                        value={formData.institutionName}
                                        onChange={handleChange}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        담당자 성함<span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="managerName"
                                        required
                                        className="w-full px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#FF5B60] focus:border-transparent outline-none transition-all"
                                        placeholder="담당자 성함을 입력하세요"
                                        value={formData.managerName}
                                        onChange={handleChange}
                                    />
                                </div>
                            </div>
                        )}

                        {/* 약관 동의 */}
                        <div className="space-y-3 pt-4">
                            <h3 className="text-sm font-semibold text-gray-800 border-b pb-2">약관 동의</h3>

                            {/* 전체 동의 */}
                            <div className="p-4 bg-[#FF5B60]/5 rounded-lg">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <div
                                        className={`w-6 h-6 rounded border-2 flex items-center justify-center transition-all ${allAgreed
                                            ? 'bg-[#FF5B60] border-[#FF5B60]'
                                            : 'border-gray-300 bg-white'
                                            }`}
                                        onClick={() => handleAllAgree(!allAgreed)}
                                    >
                                        {allAgreed && <Check size={16} className="text-white" />}
                                    </div>
                                    <span className="font-semibold text-gray-800">전체 동의</span>
                                </label>
                            </div>

                            <AgreementSection
                                title="이용약관 동의 (필수)"
                                content={TERMS_CONTENT}
                                checked={agreements.terms}
                                onChange={(checked) => setAgreements({ ...agreements, terms: checked })}
                                required
                            />

                            <AgreementSection
                                title="개인정보 수집 및 이용 동의 (필수)"
                                content={PRIVACY_CONTENT}
                                checked={agreements.privacy}
                                onChange={(checked) => setAgreements({ ...agreements, privacy: checked })}
                                required
                            />

                            <AgreementSection
                                title="마케팅 정보 수신 동의 (선택)"
                                content={MARKETING_CONTENT}
                                checked={agreements.marketing}
                                onChange={(checked) => setAgreements({ ...agreements, marketing: checked })}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !allRequiredAgreed}
                            className={`w-full py-4 rounded-lg font-bold transition-all mt-6 flex items-center justify-center gap-2 ${loading || !allRequiredAgreed
                                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                                : 'bg-[#FF5B60] text-white hover:bg-[#002d66]'
                                }`}
                        >
                            {loading && <Loader2 className="animate-spin" size={20} />}
                            {loading ? '가입 처리 중...' : '가입하기'}
                        </button>
                    </form>

                    <div className="mt-6 text-center text-sm text-gray-500">
                        이미 계정이 있으신가요? <Link to="/login" className="text-[#FF5B60] font-bold hover:underline">로그인</Link>
                    </div>
                </div>
            </Container>
        </div>
    );
};


