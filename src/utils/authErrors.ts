/**
 * Firebase Auth 에러 코드를 사용자 친화적인 한국어 메시지로 변환합니다.
 */
export const getAuthErrorMessage = (errorCode: string): string => {
    switch (errorCode) {
        // 로그인/인증 관련
        case 'auth/user-not-found':
        case 'auth/wrong-password':
        case 'auth/invalid-credential':
            return '이메일 또는 비밀번호가 올바르지 않습니다.';
        case 'auth/invalid-email':
            return '유효하지 않은 이메일 형식입니다.';
        case 'auth/user-disabled':
            return '비활성화된 계정입니다. 관리자에게 문의하세요.';

        // 회원가입 관련
        case 'auth/email-already-in-use':
            return '이미 사용 중인 이메일입니다.';
        case 'auth/weak-password':
            return '비밀번호가 너무 취약합니다. (8자 이상, 영문/숫자 조합 권장)';

        // 기타 서버 및 네트워크 오류
        case 'auth/network-request-failed':
            return '네트워크 연결에 실패했습니다. 인터넷 연결을 확인해주세요.';
        case 'auth/too-many-requests':
            return '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
        case 'auth/operation-not-allowed':
            return '이메일/비밀번호 로그인이 활성화되지 않았습니다.';
        case 'auth/requires-recent-login':
            return '보안을 위해 다시 로그인한 후 시도해주세요.';

        default:
            return '인증 처리 중 오류가 발생했습니다. 다시 시도해주세요.';
    }
};
