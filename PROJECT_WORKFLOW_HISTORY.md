# [프로젝트 전체 구축 보고서] 부산시의회 입법정책 지원 시스템 v2.0

본 문서는 **[부산광역시의회 입법정책 지원: 타시도 조례 모니터링 & 신규 조례 발굴 시스템 v2.0]** 의 기획부터 구현, 로컬 환경 구축, GitHub 저장소 연결, GitHub Pages 배포, 그리고 Vercel 호스팅 설정까지의 전체 작업 순서와 가이드를 정리한 프로젝트 히스토리 파일입니다.

---

## 📋 목차
1. [프로젝트 개요](#1-프로젝트-개요)
2. [1단계: 기획 및 시스템 설계](#2-1단계-기획-및-시스템-설계)
3. [2단계: 풀스택 구현 (Backend & Frontend)](#3-2단계-풀스택-구현-backend--frontend)
4. [3단계: 로컬 실행 환경 구축](#4-3단계-로컬-실행-환경-구축)
5. [4단계: GitHub 저장소 연결 및 Pages 자동 배포](#5-4단계-github-저장소-연결-및-pages-자동-배포)
6. [5단계: Vercel 연동 설정](#6-5단계-vercel-연동-설정)
7. [6단계: 접속 주소 및 운영 가이드](#7-6단계-접속-주소-및-운영-가이드)

---

## 1. 프로젝트 개요

- **프로젝트명**: 부산광역시의회 입법정책 지원 [타시도 조례 모니터링 & 신규 조례 발굴 시스템 v2.0]
- **주요 사용자**: 부산시의회 정책지원관
- **핵심 목적**: 전국 17개 광역 지자체의 최근 1년 내 제·개정 조례를 상시 모니터링하고, 부산시 미제정 조례를 발굴하여 3줄 입법 시사점과 함께 정책 입안 자료 제공.
- **주요 기술 스택**:
  - **Frontend**: Next.js 14 (App Router), TypeScript, Tailwind CSS, Lucide Icons, SheetJS (`xlsx`)
  - **Backend / API**: FastAPI (Python 3.12), SQLite3, APScheduler, Requests, Pydantic
  - **Hosting & Deployment**: GitHub Pages (`gh-pages`, `docs/` 정적 호스팅), Vercel (`vercel.json`)

---

## 2. 1단계: 기획 및 시스템 설계

### (1) 데이터 소스 및 수집 전략
- **국가법령정보센터 자치법규 Open API (`law.go.kr`)** 연동.
- **일일 배치 스케줄러 (`APScheduler`)**: 매일 오전 08:00 AM 자동 수집 및 동기화.
- **오프라인 115건 Mock Data Seeder**: API 키 미설정 상태에서도 17개 시·도의 최근 1년 조례 115건 및 부산시 마스터 조례로 즉시 시연 가능.

### (2) 핵심 기능 기획
1. **부산시 입법 Gap 분석 엔진**: 타시도 제정 조례를 부산시 기제정 조례 목록과 형태소/유사도 비교 후 `부산시 미제정/발굴 추천` 태그 부여.
2. **정책지원관용 3줄 입법 시사점 요약**: `[입법 배경]`, `[주요 내용]`, `[부산시 시사점]` 자동 세줄 요약 생성.
3. **대시보드 필터링**: 16개 광역 시도 선택, 제개정 구분, 공포기간, 미제정 전용 토글, 키워드 칩, 카드/테이블 뷰 전환.
4. **엑셀(.xlsx) 내보내기**: SheetJS를 이용한 검색 결과 원클릭 `.xlsx` 다운로드.
5. **개인 워크스페이스**: 관심 조례 스크랩(북마크) 및 검토의견/검토상태(`검토예정`, `검토중`, `발굴완료`, `보류`) 저장.

---

## 3. 2단계: 풀스택 구현 (Backend & Frontend)

### (1) 백엔드 (Python FastAPI)
- `backend/app/database.py`: SQLite 테이블 생성 (`ordinances`, `busan_ordinances`, `scraps_memos`, `sync_logs`).
- `backend/app/seeder.py`: 17개 시도 115건 sample 데이터 및 부산시 기존 조례 마스터 데이터 입력.
- `backend/app/gap_analyzer.py`: 부산시 조례 대조 및 3줄 입법 시사점 생성 알고리즘.
- `backend/app/collector.py`: law.go.kr API 연동 및 자동 수집 로직.
- `backend/app/scheduler.py`: 매일 08:00 AM 정기 스케줄러.
- `backend/app/main.py`: REST API 엔드포인트 제공 (`/api/ordinances`, `/api/stats`, `/api/scraps`, `/api/memos`, `/api/sync`).

### (2) 프론트엔드 (Next.js 14)
- `frontend/src/components/Header.tsx`: 통계 카운터, 상단 탭, `v2.0` 버전 표시.
- `frontend/src/components/FilterBar.tsx`: 다중 필터링, 검색, 미제정 토글, 엑셀 다운로드 버튼.
- `frontend/src/components/OrdinanceCard.tsx` & `OrdinanceTable.tsx`: 카드/테이블 뷰 UI.
- `frontend/src/components/DetailModal.tsx`: 상세 검토, 3줄 요약, 개인 메모/검토상태 편집기.
- `frontend/src/components/SyncModal.tsx`: 수집 이력 확인 및 수동 실행.
- `frontend/src/app/page.tsx`: 이중 API 경로 연결(Direct & Relative) 및 정적 JSON 듀얼 폴백 처리로 무한 스피너 현상 완벽 방지.

---

## 4. 3단계: 로컬 실행 환경 구축

로컬 환경에서 개발자 및 사용자가 한 번의 클릭으로 전체 백엔드와 프론트엔드를 실행할 수 있도록 구동 스크립트를 작성했습니다.

- **`start.bat`**: 8000번/3000번 기존 포트 점유 프로세스를 자동 정리한 후 백엔드(FastAPI :8000)와 프론트엔드(Next.js :3000)를 일괄 구동하는 배치 스크립트.
- **`run.ps1`**: PowerShell 사용자용 원클릭 구동 스크립트.

---

## 5. 4단계: GitHub 저장소 연결 및 Pages 자동 배포

### (1) 깃허브용 정적 데이터 내보내기 & 정적 빌드
- `backend/app/export_static_data.py`: SQLite DB 데이터를 `frontend/public/data/`의 JSON 파일로 자동 내보내는 스크립트 작성.
- `frontend/next.config.ts`: `output: "export"`, `images: { unoptimized: true }`, `basePath: "/lowsistem"` 설정.
- `frontend/public/.nojekyll`: GitHub Pages가 Next.js `_next` 정적 에셋 폴더를 차단하지 않도록 설정.
- `docs/` 정적 호스팅 폴더 생성: Next.js 정적 빌드 결과를 `docs/`에 복사.

### (2) Git 초기화 및 커밋
- Git 사용자 설정 및 초기 커밋 진행:
  ```bash
  git init
  git branch -M main
  git add .
  git commit -m "Initial commit & v2.0 upgrade"
  ```

### (3) GitHub 업로드 & `gh-pages` 브랜치 분리 배포
- 저장소 URL: `https://github.com/silverstar0485/lowsistem.git`
- `main` 브랜치 및 `gh-pages` 전용 배포 브랜치 푸시:
  ```bash
  git push -u origin main
  git subtree split --prefix docs -b gh-pages
  git push -u origin gh-pages -f
  ```

---

## 6. 5단계: Vercel 연동 설정

Vercel(`https://vercel.com`) 플랫폼에서 클릭 한 번으로 배포할 수 있도록 설정 파일 작성 및 업로드 완료.

- **`vercel.json` (루트 경로)**:
  ```json
  {
    "version": 2,
    "buildCommand": "cd frontend && npm install && npm run build",
    "outputDirectory": "frontend/out",
    "framework": "nextjs"
  }
  ```
- **`frontend/vercel.json` (프론트엔드 경로)**:
  ```json
  {
    "version": 2,
    "framework": "nextjs"
  }
  ```

---

## 7. 6단계: 접속 주소 및 운영 가이드

### (1) 로컬 개발 환경 접속
- **웹 앱 (Next.js)**: [http://localhost:3000](http://localhost:3000)
- **API 서버 (FastAPI)**: [http://127.0.0.1:8000](http://127.0.0.1:8000)

### (2) 원격 온라인 웹사이트 접속
- **GitHub 저장소**: [https://github.com/silverstar0485/lowsistem](https://github.com/silverstar0485/lowsistem)
- **GitHub Pages 서비스 URL**: **[https://silverstar0485.github.io/lowsistem/](https://silverstar0485.github.io/lowsistem/)**

---

### 💡 유지보수 및 업데이트 팁
새로운 조례 데이터를 추가하거나 소스 코드를 수정할 경우:
1. `push_to_github.bat` 실행 ➔ GitHub 원격 저장소 자동 업데이트
2. GitHub Pages (`/docs` 또는 `gh-pages`) ➔ 약 1분 후 웹 브라우저에 자동 실시간 반영
