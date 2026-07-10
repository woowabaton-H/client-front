import { expect, test } from "@playwright/test";

test.describe.configure({ mode: "serial" });

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /오늘은 여기만 봐도 충분해요/ })).toBeVisible({ timeout: 15_000 });
});

test("홈과 알림은 서버 데이터로 렌더링된다", async ({ page }) => {
  const homeResponse = await page.request.get("/api/v1/home");
  const home = (await homeResponse.json()) as { data: { categories: Array<{ name: string }> } };
  await expect(page.getByText(home.data.categories[0].name, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "알림", exact: true }).click();
  await expect(page.getByRole("dialog", { name: "알림" })).toBeVisible();
  await expect(page.getByText("서버에서 받은 최신 알림입니다.")).toBeVisible();
  const readAll = page.getByRole("button", { name: "모두 읽음", exact: true });
  if (await readAll.isVisible()) {
    await readAll.click();
    await expect(readAll).toBeHidden();
  }
});

test("셀렉션 필터와 상세는 API 결과를 표시한다", async ({ page }) => {
  const listResponse = await page.request.get("/api/v1/selections?limit=100");
  const list = (await listResponse.json()) as {
    data: Array<{ id: string; category: string; title: string }>;
  };
  const target = list.data.find((item) => item.category !== "전체");
  expect(target).toBeTruthy();
  const detailResponse = await page.request.get(`/api/v1/selections/${target!.id}`);
  const detail = (await detailResponse.json()) as { data: { checks: string[] } };

  await page.getByRole("button", { name: "비누 픽", exact: true }).click();
  await page.getByRole("button", { name: target!.category, exact: true }).click();
  const card = page.locator('[data-slot="card"]').filter({ hasText: target!.title });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "자세히 보기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: target!.title });
  await expect(dialog.getByText(detail.data.checks[0], { exact: true })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "외부 보기", exact: true })).toBeVisible();
});

test("커뮤니티 탭, 상세, 댓글은 API 결과를 표시한다", async ({ page }) => {
  const postsResponse = await page.request.get("/api/v1/community/posts?type=qa&limit=20");
  const posts = (await postsResponse.json()) as { data: Array<{ id: string; title: string }> };
  const target = posts.data[0];
  const commentsResponse = await page.request.get(`/api/v1/community/posts/${target.id}/comments?limit=20`);
  const comments = (await commentsResponse.json()) as { data: Array<{ body: string }> };

  await page.getByRole("button", { name: "커뮤니티", exact: true }).click();
  await page.getByRole("tab", { name: "Q&A", exact: true }).click();
  await page.getByRole("heading", { name: target.title, exact: true }).click();
  if (comments.data.length) {
    await expect(page.getByText(comments.data[0].body)).toBeVisible();
  }
  await expect(page.getByPlaceholder("답변을 남겨주세요", { exact: true })).toBeVisible();
});

test("마이 요약과 프로필 수정 폼은 서버 사용자 값을 사용한다", async ({ page }) => {
  const meResponse = await page.request.get("/api/v1/me");
  const me = (await meResponse.json()) as { data: { name: string; avatarText: string } };
  await page.getByRole("button", { name: "마이", exact: true }).click();
  await expect(page.getByText(`${me.data.name}님의 비누 기록`, { exact: true })).toBeVisible();
  await page.getByRole("button", { name: "프로필 수정", exact: true }).click();
  await expect(page.getByLabel("이름", { exact: true })).toHaveValue(me.data.name);
  await expect(page.getByLabel("아바타 글자", { exact: true })).toHaveValue(me.data.avatarText);
});
