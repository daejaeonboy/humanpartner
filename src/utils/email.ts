// Email API 호출 유틸리티 (Firebase Cloud Functions)

export interface BookingNotificationItem {
    name: string;
    quantity: number;
    price?: number;
    model_name?: string;
}

export interface BookingRequestNotificationPayload {
    bookingId: string;
    productName: string;
    requesterName: string;
    companyName?: string;
    phone?: string;
    userEmail?: string;
    startDate: string;
    endDate: string;
    totalPrice: number;
    basicComponents?: BookingNotificationItem[];
    selectedOptions?: BookingNotificationItem[];
}

const isLocalhost = () =>
    window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

const resolveEmailApiUrl = (cloudFunctionName: string, hostedPath: string) =>
    isLocalhost()
        ? `https://us-central1-human-partner.cloudfunctions.net/${cloudFunctionName}`
        : hostedPath;

const getResponseErrorMessage = (payload: unknown) => {
    if (payload && typeof payload === 'object' && 'error' in payload && typeof payload.error === 'string') {
        return payload.error;
    }
    return '이메일 발송 실패';
};

const postEmailRequest = async (
    apiUrl: string,
    body: unknown,
    idToken?: string,
) => {
    const headers: Record<string, string> = {
        'Content-Type': 'application/json',
    };

    if (idToken) {
        headers.Authorization = `Bearer ${idToken}`;
    }

    const response = await fetch(apiUrl, {
        method: 'POST',
        headers,
        body: JSON.stringify(body),
    });

    const contentType = response.headers.get('content-type') || '';
    const payload = contentType.includes('application/json')
        ? await response.json()
        : await response.text();

    if (!response.ok) {
        throw new Error(getResponseErrorMessage(payload));
    }

    return payload;
};

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
    const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <h1 style="color: #39B54A; margin: 0;">행사어때</h1>
                <p style="color: #666; font-size: 14px;">대전 MICE 행사 통합운영 플랫폼</p>
            </div>
            
            <div style="background-color: #f9f9f9; padding: 30px; border-radius: 8px; text-align: center;">
                <h2 style="color: #333; margin-top: 0;">이메일 인증 안내</h2>
                <p style="color: #555; line-height: 1.5;">
                    안녕하세요, ${toName}님.<br/>
                    행사어때 회원가입을 환영합니다.<br/>
                    아래 인증번호를 회원가입 화면에 입력해주세요.
                </p>
                
                <div style="margin: 30px 0;">
                    <span style="display: inline-block; background-color: #fff; padding: 15px 30px; font-size: 24px; font-weight: bold; color: #39B54A; border: 2px solid #39B54A; border-radius: 5px; letter-spacing: 5px;">
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
        const apiUrl = resolveEmailApiUrl(
            'sendEmailVerification',
            '/api/email/verify',
        );

        return await postEmailRequest(apiUrl, {
            to: toEmail,
            subject: '[행사어때] 회원가입 이메일 인증번호',
            html: htmlContent,
        });
    } catch (error) {
        console.error('Email send failed:', error);
        throw error;
    }
};

export const sendBookingRequestNotificationEmail = async (
    payload: BookingRequestNotificationPayload,
    idToken: string,
) => {
    try {
        const apiUrl = resolveEmailApiUrl(
            'sendBookingRequestNotification',
            '/api/email/booking-request',
        );

        return await postEmailRequest(apiUrl, payload, idToken);
    } catch (error) {
        console.error('Booking notification email send failed:', error);
        throw error;
    }
};
