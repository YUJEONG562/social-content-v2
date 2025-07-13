# SNS 콘텐츠 생성기 - 정적 HTML 버전

## 파일 구성
- `index.html` - 완전한 단일 HTML 파일
- 모든 CSS, JavaScript 포함
- CDN을 통한 외부 라이브러리 로드

## 특징
✓ **완전한 기능**: AI 콘텐츠 생성, 주제 제안, 탭 인터페이스
✓ **Netlify Functions 연동**: 서버리스 AI 기능
✓ **오프라인 감지**: 인터넷 연결 상태 확인
✓ **반응형 디자인**: 모바일/데스크톱 지원
✓ **단일 파일**: 설치나 빌드 과정 불필요

## 사용 방법

### 방법 1: Netlify에 배포
1. Netlify에 `index.html` 업로드
2. Netlify Functions 활성화
3. `OPENAI_API_KEY` 환경변수 설정
4. 완전한 AI 기능 사용 가능

### 방법 2: 로컬에서 실행
1. `index.html` 파일을 브라우저에서 열기
2. AI 기능은 Netlify Functions 엔드포인트 필요
3. 또는 다른 API 서버 연결

## 기술 스택
- **Pure HTML/CSS/JavaScript** (프레임워크 없음)
- **Tailwind CSS** (CDN)
- **Netlify Functions** (서버리스 백엔드)
- **OpenAI API** (콘텐츠 생성)

## API 엔드포인트
- `/.netlify/functions/generate-content` - 콘텐츠 생성
- `/.netlify/functions/generate-topics` - 주제 제안
- `/.netlify/functions/usage-status` - 사용량 확인

## 주의사항
- OpenAI API 키가 필요합니다
- 인터넷 연결 필수
- 최신 브라우저 권장 (ES6+ 지원)