# 이메일 인증번호 발송 장애 해결 기록 (상세)

**작성일시**: 2026-02-05  
**대상 프로젝트**: `human-partner`  
**범위**: Firebase Hosting + Cloud Functions(Gen1) 기반 이메일 인증번호 발송(`/api/email/verify`)

## 1. 요약
- 프론트에서 인증번호 발송 시 500 에러가 발생했고, Cloud Functions에서 Gmail SMTP 인증(`535 5.7.8`)이 실패하고 있었음.
- 최종 원인은 **Gmail 발신 계정(`EMAIL_USER`) 불일치** 및 **앱 비밀번호(`EMAIL_PASS`) 불일치/교체 필요**로 확정.
- 앱 비밀번호 교체 + 발신 계정 정정 + Functions 재배포 후 **정상 발송 확인**.

## 2. 장애 증상
1. 브라우저 개발자 콘솔에서 `/api/email/verify` 요청이 500으로 실패.
2. 프론트 코드(`src/utils/email.ts`)에서 “Failed to send email”류 에러가 출력.
3. Functions 로그에서 다음 오류가 반복 확인됨.
   - `EAUTH`
   - `535 5.7.8 Username and Password not accepted`

## 3. 원인 분석(최종)
1. SMTP 인증 오류(535)는 코드 로직보다 **자격증명 불일치**에서 가장 흔히 발생.
2. 실제 사용자 계정이 `cryingonion77@gmail.com`인데, 기존 설정이 `cryingonion77l@gmail.com` 등으로 불일치했던 정황이 확인됨.
3. 앱 비밀번호는 공백 포함 형태로 전달되는 경우가 많아, `.env` 값에 공백/따옴표가 포함되면 인증 실패 가능성이 커짐.

## 4. 코드 변경(백엔드)
**수정 파일**: `functions/src/index.ts`

### 4.1 변경 목적
- `.env` 값이 따옴표/공백 때문에 오염되어도 최대한 안전하게 처리.
- 자격증명 누락 시 “성공처럼 보이는 응답”을 주지 않고, 명확히 실패(500)로 반환.

### 4.2 변경 내용
1. `dotenv.config()` 추가
   - 로컬/에뮬레이터 환경에서 `.env` 로딩을 보장하기 위함.
2. `normalizeEnvValue()` 추가
   - `trim()` 처리
   - 문자열 양 끝의 따옴표(`'`, `"`) 제거
3. `EMAIL_USER`, `EMAIL_PASS` 필수 검증 강화
   - 둘 중 하나라도 비어 있으면 500 반환(`Missing SMTP credentials`)
4. nodemailer transporter 생성 시 정규화된 값 사용

## 5. 설정 변경(자격증명)
**수정 파일**: `functions/.env`

1. `EMAIL_PASS`
   - 새로 생성한 Gmail 앱 비밀번호로 교체.
   - 공백이 포함된 전달값은 공백을 제거한 형태로 적용.
   - 보안상 문서에는 실제 비밀번호 값을 기록하지 않음.
2. `EMAIL_USER`
   - 사용자 실제 계정인 `cryingonion77@gmail.com`으로 정정.

## 6. 배포 과정/이슈
1. Functions 배포 명령: `firebase deploy --only functions`
2. 배포 중 간헐적으로 아래 오류가 발생할 수 있음(실제로 발생함).
   - `FAILED_PRECONDITION: An operation on function ... is already in progress`
3. 대응
   - 수십 초~수 분 대기 후 재시도.
   - (이미 반영된 경우) `No changes detected`로 스킵될 수 있음.

## 7. 검증 및 최종 결과
1. 재배포 후 회원가입 화면에서 인증번호 발송을 재시도.
2. 사용자 확인 기준, 2026-02-05 14:33(KST) 시점에 인증번호 이메일 **정상 수신**으로 문제 해결 확인.

## 8. 변경 파일 목록(최종)
- `functions/src/index.ts`: `.env` 로딩/정규화/자격증명 검증 강화
- `functions/.env`: `EMAIL_USER`, `EMAIL_PASS` 갱신
- `docs/humanpartner/logs/email_troubleshooting_report.md`: 트러블슈팅 타임라인 및 최종 정상화 기록 정리

## 9. 보안 메모
- 앱 비밀번호는 **절대 Git에 커밋하지 않으며**, 문서/로그에도 원문 값을 남기지 않음.
- 향후에는 Secret Manager 또는 Functions의 환경변수 관리 기능을 사용해 운영 자격증명 노출 위험을 줄이는 것을 권장.

