// Email API 호출 유틸리티 (Firebase Cloud Functions)

/**
 * 6자리 랜덤 인증번호 생성
 */
export const generateVerificationCode = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
};

/**
 * 이메일 발송 함수 (백엔드 API 호출)
 * @param toName 수신자 이름
 * @param toEmail 수신자 이메일
 * @param code 인증번호
 */
export const sendVerificationEmail = async (toName: string, toEmail: string, code: string) => {
    // HTML 템플릿 생성
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #FF5B60; margin: 0;">마이스파트너</h1>
                <p style="color: #666; font-size: 14px;">MICE 장비 렌탈의 모든 것</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center;">
                <h2 style="color: #333; margin-top: 0;">이메일 인증 안내</h2>
                <p style="color: #555; line-height: 1.5;">
                    안녕하세요, ${toName}님.<br/>
                    행사어때 회원가입을 환영합니다.<br/>
                    아래 인증번호를 회원가입 화면에 입력해주세요.
                </p>
                
                <div style="margin: 30px 0;">
                    <span style="display: inline-block; background-color: #fff; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #FF5B60; border: 2px solid #FF5B60; border-radius: 5px; letter-spacing: 5px;">
                        ${code}
                    </span>
                </div>
                
                <p style="color: #888; font-size: 12px;">
                    본 메일은 발신 전용이며 회신되지 않습니다.<br/>
                    인증번호는 10분간 유효합니다.
                </p>
            </div>
            
            <div style="text-align: center; margin-top: 20px; color: #aaa; font-size: 12px;">
                &copy; 2026 Hangsaeottae. All rights reserved.
            </div>
        </div>
    `;

    try {
        // 로컬 환경(localhost)에서는 클라우드 함수 URL 직접 호출
        // 배포 환경(firebase hosting)에서는 rewrites 규칙에 따라 상대 경로 호출
        const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
        const apiUrl = isLocalhost
            ? 'https://us-central1-human-partner.cloudfunctions.net/sendEmailVerification'
            : '/api/email/verify';

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                to: toEmail,
                subject: '[행사어때] 회원가입 이메일 인증번호',
                html: htmlContent
            }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || '이메일 발송 실패');
        }

        return await response.json();
    } catch (error) {
        console.error('Email send failed:', error);
        throw error;
    }
};
