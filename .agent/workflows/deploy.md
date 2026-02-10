---
description: 홈페이지 배포 방법 및 자동 배포 규칙
---

# 자동 배포 규칙

**중요: 코드 수정 후 항상 자동으로 홈페이지에 배포해야 합니다.**

수정이 완료되면 다음 단계를 자동으로 실행합니다:

## 배포 단계

// turbo
1. 빌드 실행
```bash
npm run build
```

2. Firebase 배포
```bash
firebase deploy --only hosting
```

## 배포 URL
- 홈페이지: https://human-partner.web.app

## 주의사항
- 빌드 에러가 없는지 확인
- 배포 후 사이트 접속 확인
