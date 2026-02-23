# 이메일 인증 구현 및 트러블슈팅 리포트

**작성일시**: 2026-02-05
**작성자**: Antigravity (AI Assistant)

## 1. 개요 (Overview)
본 문서는 `human-partner` 프로젝트의 회원가입 시 이메일 인증 기능 구현 과정, 아키텍처, 발생한 이슈 및 해결 시도 내역을 상세하게 기록합니다. 현재 기능이 정상 작동하지 않는 원인을 파악하고 해결책을 모색하기 위함입니다.

## 2. 시스템 아키텍처 (Architecture)
이메일 발송 시스템은 **Serverless Architecture**를 채택하여 구현되었습니다.

1.  **Frontend (React)**:
    *   사용자가 회원가입 폼에서 이메일 입력 후 '인증번호 발송' 버튼 클릭.
    *   `src/utils/email.ts`에서 API 호출: `/api/email/verify`.
    *   `firebase.json`의 `rewrites` 설정을 통해 해당 요청이 Cloud Functions로 라우팅됨.

2.  **Backend (Firebase Cloud Functions)**:
    *   **Runtime**: Node.js 20 (Gen 1)
    *   **Function Name**: `sendEmailVerification`
    *   **Logic**:
        *   랜덤 6자리 인증코드 생성.
        *   `nodemailer` 라이브러리를 사용하여 SMTP 통신.
        *   Gmail SMTP Server (`smtp.gmail.com`) 사용.
    *   **Security**:
        *   환경 변수(`.env`)를 통해 `EMAIL_USER`, `EMAIL_PASS` 관리.
        *   `process.env`로 접근.

## 3. 구현 히스토리 및 시도 내역 (Timeline)

### 3.1. 초기 구현 및 마이그레이션
*   **기존**: 로컬 Express 서버(`server/`)에서 구동.
*   **변경**: 운영 비용 절감 및 관리 효율성을 위해 Firebase Cloud Functions로 전면 이관.
*   **이슈**: `functions.config()` 방식이 Deprecated 되어 최신 `.env` 파일 방식으로 전환함. Node.js 18에서 20으로 런타임 업그레이드 진행.

### 3.2. 배포 및 환경 설정
*   **요금제 업그레이드**: 외부 네트워크(SMTP) 사용을 위해 Firebase 요금제를 Spark(무료)에서 Blaze(종량제)로 업그레이드 완료.
*   **환경 변수 설정**: `functions/.env` 파일을 생성하여 Gmail 계정 정보 설정.

### 3.3. SMTP 인증 오류 (Error 535) 해결 시도
**증상**: 배포 후 이메일 발송 시 `Response Code: 535` (Authentication Failed) 오류 발생.

*   **원인 1**: 일반 로그인 비밀번호 사용 불가.
    *   **조치**: Google 계정 보안 설정에서 '앱 비밀번호(App Password)' 생성 후 교체.
*   **원인 2**: 앱 비밀번호 포맷 문제 (공백 포함).
    *   **상세**: 사용자가 제공한 앱 비밀번호(`flqm khui ...`)에 공백이 포함되어 있어, SMTP 서버 전송 시 문자열 불일치로 추정됨.
    *   **조치**: `.env` 파일 내에서 공백을 모두 제거한 형태(`flqmkhuicleueuyk`)로 수정 후 `firebase deploy --force`로 재배포.

## 4. 현재 상태 및 이슈 (Current Status)
*   **최근 배포**: 발신 계정/앱 비밀번호 갱신 후 재배포 완료 (2026-02-05 14:17 KST).
*   **현상**: 인증번호 정상 발송 확인 (사용자 확인: 2026-02-05 14:33 KST).

## 5. 최종 결론 (Final Status)
- `EMAIL_USER` 불일치 및 앱 비밀번호 오류가 주요 원인.
- 발신 계정 정정 + 앱 비밀번호 갱신 후 정상 발송 확인 (2026-02-05 14:33 KST).

## 6. 원인 분석 (Root Cause)
1. `functions/.env`의 `EMAIL_PASS` 값이 따옴표로 감싸져 있어, SMTP 인증 시 비밀번호 앞뒤에 불필요한 문자가 포함될 가능성이 확인됨.
2. Cloud Functions 코드에서 `EMAIL_PASS` 유효성 검사를 하지 않아 잘못된 자격증명으로도 전송 시도가 발생.

## 7. 해결 내용 (Fix)
1. `functions/src/index.ts`에서 환경 변수 값을 `trim` + 따옴표 제거(`normalizeEnvValue`)하도록 보강.
2. `EMAIL_USER` 또는 `EMAIL_PASS`가 비어 있으면 500 응답으로 명확히 실패를 반환하도록 변경.
3. `dotenv.config()` 추가로 로컬/에뮬레이터 환경에서 `.env` 로딩 보장.
4. 변경 후 Functions 재배포 필요: `firebase deploy --only functions`

## 8. 확인 항목 (Verification)
1. 실제 수신 메일 도착 여부 확인 (완료).

## 9. 배포/로그 확인 결과 (2026-02-05)

### 9.1 배포 시도 결과
- 1차/2차 시도에서 `sendEmailVerification` 업데이트가 "operation in progress" 상태로 실패.
- 약 2분 대기 후 재시도 시 "No changes detected"로 스킵 처리됨.
- Audit Log 기준 업데이트 호출은 2026-02-05T05:06:20Z (KST 2026-02-05 14:06) 시점에 기록됨.

### 9.2 최신 Functions 로그
- 2026-02-05T04:44:45Z (KST 13:44) 기준 `EAUTH` / `535 5.7.8 Username and Password not accepted` 오류가 확인됨.
- 이후 정상 발송 확인은 9.7 참고.

### 9.3 현재 결론
- 당시에는 SMTP 인증 실패(535) 지속 여부 확인이 필요했으나, 이후 9.7에서 정상 발송을 확인함.

### 9.4 추가 재시도 결과 (2026-02-05)
- 사용자가 실제 화면에서 재시도한 직후 로그 확인 결과, 2026-02-05T05:09:49Z (KST 14:09:49)에도 `535 5.7.8 Username and Password not accepted` 오류가 다시 발생함.
- 따라서 현재 실패 원인은 코드가 아니라 SMTP 자격증명(앱 비밀번호) 불일치로 확정됨.

### 9.5 자격증명 교체 및 재배포 (2026-02-05 14:17 KST)
- Gmail 앱 비밀번호를 새로 발급한 값으로 교체(공백 제거 후 적용).
- `firebase deploy --only functions` 재배포 성공.

### 9.6 발신 계정 일치 수정 (2026-02-05 14:25 KST)
- 사용자의 실제 이메일(`cryingonion77@gmail.com`)과 `EMAIL_USER`가 불일치했던 문제 확인.
- `functions/.env`의 `EMAIL_USER`를 `cryingonion77@gmail.com`으로 수정.
- 재배포 시 일시적으로 "operation in progress"가 발생했으나, 이후 재시도에서 변경사항 없음으로 처리됨(환경변수 반영 완료로 추정).

### 9.7 정상 발송 확인 (2026-02-05 14:33 KST)
- 회원가입 화면에서 인증번호 정상 발송 확인.
