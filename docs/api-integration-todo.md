# API Integration TODO

프론트 기준으로 아직 백엔드와 연결되지 않은 API 목록이다. 현재 주기 핵심 흐름은 연결되어 있으므로, 아래 항목을 위에서부터 하나씩 처리한다.

## 이미 연결됨

- 홈 주기 조회: `GET /api/v1/home`
- 주기 프리셋 조회: `GET /api/v1/category-presets`
- 주기 완료 처리: `POST /api/v1/categories/{categoryId}/complete`
- 기존 주기 변경: `PATCH /api/v1/categories/{categoryId}`
- 프리셋 주기 추가: `POST /api/v1/categories`

## 다음 작업 순서

### 1. 알림

현재 상태: 알림 버튼은 실제 알림 API가 아니라 홈 주기 상태로 만든 로컬 시트를 보여준다.

연결할 API:
- `GET /api/v1/notifications`
- `POST /api/v1/notifications/{notificationId}/read`
- `PUT /api/v1/notifications/read-all`

프론트 작업:
- 알림 시트를 서버 알림 목록 기반으로 렌더링한다.
- 알림 클릭 또는 닫기 시 읽음 처리한다.
- 모두 읽음 액션을 추가한다.
- 홈 헤더의 unread dot을 서버 unread 상태와 동기화한다.

### 2. 완료 히스토리와 마이 요약

현재 상태: 최근 완료는 `home.recentLogs` 일부만 사용하고, 마이 통계/히스토리는 로컬 계산에 가깝다.

연결할 API:
- `GET /api/v1/completion-logs`
- `GET /api/v1/me/summary`

프론트 작업:
- 완료 히스토리 시트를 커서 페이지네이션 기반으로 바꾼다.
- 마이의 이번 달 완료, 주간 발자국, 사용 중인 주기 수를 서버 요약과 맞춘다.
- `했어요` 성공 후 히스토리/요약 갱신 전략을 정한다.

### 3. 셀렉션

현재 상태: 셀렉션 목록, 상세, 저장 상태가 모두 하드코딩과 로컬 상태다.

연결할 API:
- `GET /api/v1/selections`
- `GET /api/v1/selections/{selectionId}`
- `PUT /api/v1/selections/{selectionId}/save`
- `DELETE /api/v1/selections/{selectionId}/save`
- `POST /api/v1/selections/{selectionId}/external-view`
- `GET /api/v1/me/saved-selections`

프론트 작업:
- 목록 필터를 서버 `category`, `type`, `cursor`, `limit` 쿼리로 연결한다.
- 상세 시트에서 상세 API를 호출해 `checks`, `providers`, `notice`를 표시한다.
- 담기/담김 버튼을 서버 저장 API와 연결한다.
- 외부 보기 버튼 클릭 시 external-view를 기록한다.

### 4. 커뮤니티

현재 상태: 커뮤니티 글, 상세, 댓글, 도움됨, 저장이 모두 하드코딩과 로컬 상태다.

연결할 API:
- `GET /api/v1/community/posts`
- `POST /api/v1/community/posts`
- `GET /api/v1/community/posts/{postId}`
- `GET /api/v1/community/posts/{postId}/comments`
- `POST /api/v1/community/posts/{postId}/comments`
- `PUT /api/v1/community/posts/{postId}/helpful`
- `DELETE /api/v1/community/posts/{postId}/helpful`
- `PUT /api/v1/community/posts/{postId}/save`
- `DELETE /api/v1/community/posts/{postId}/save`

프론트 작업:
- 탭별 글 목록을 서버 `type=tips|qa`로 조회한다.
- 글 상세 진입 시 상세와 댓글을 서버에서 가져온다.
- 글 작성, 댓글 작성, 도움됨, 저장을 서버 mutation으로 바꾼다.
- 서버 응답 필드와 현재 UI 필드의 mapper를 분리한다.

### 5. 사용자 프로필

현재 상태: 이름, 아바타, 마이 화면 문구가 정적이다.

연결할 API:
- `GET /api/v1/me`
- `PATCH /api/v1/me`

프론트 작업:
- 헤더/마이 화면의 사용자 이름과 아바타를 서버 값으로 표시한다.
- 프로필 수정 UI를 추가한다.
- 수정 성공 후 홈/마이 표시에 즉시 반영한다.

## 백엔드에 없는 기능

프론트 구현 전에 백엔드 API 추가 여부를 먼저 결정해야 한다.

- 카테고리 비활성화 또는 삭제
- 직접 입력 카테고리 생성 UI에 필요한 아이콘 선택 정책
- 카테고리 이름/노트 수정 UI 정책
- 알림 설정 변경
- 실제 인증/게스트 세션 생성

## 공통 정리 작업

- `CleanLoopApp.tsx`에서 API mapper, hooks, 화면 컴포넌트를 분리한다.
- 서버 호출 상태를 `loading`, `error`, `empty`로 화면에 명확히 표시한다.
- 각 연동 단위마다 Playwright 검증 시나리오를 남긴다.
- 가능하면 반복 가능한 E2E 테스트 파일로 승격한다.
