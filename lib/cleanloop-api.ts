export type ApiMeta = {
  requestId?: string;
  nextCursor?: string | null;
};

type ApiEnvelope<T> = {
  data: T;
  meta: ApiMeta;
};

type ApiErrorEnvelope = {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  };
};

export type ApiPage<T> = {
  items: T[];
  nextCursor: string | null;
};

export type ApiCategoryStatus = {
  code: "due" | "soon" | "good";
  label: string;
  daysUntilNext: number;
};

export type ApiCategory = {
  id: string;
  name: string;
  icon: string;
  cycleDays: number;
  lastDoneAt: string;
  nextDueAt: string;
  note: string;
  status: ApiCategoryStatus;
  createdAt: string;
  updatedAt: string;
};

export type ApiCompletionLog = {
  id: string;
  categoryId: string | null;
  categoryName: string;
  completedAt: string;
};

export type ApiHome = {
  today: string;
  message: string;
  monthlyCompletionCount: number;
  unreadNotificationCount: number;
  categories: ApiCategory[];
  recentLogs: ApiCompletionLog[];
};

export type ApiCategoryPreset = {
  key: string;
  name: string;
  icon: string;
  cycleDays: number;
  note: string;
};

export type ApiCompleteCategoryResult = {
  category: ApiCategory;
  log: ApiCompletionLog;
  toastMessage: string;
};

export type ApiNotification = {
  id: string;
  categoryId: string | null;
  categoryName: string | null;
  title: string;
  body: string;
  deepLink?: string | null;
  isRead: boolean;
  createdAt: string;
};

export type ApiNotificationList = {
  unreadCount: number;
  notifications: ApiNotification[];
};

export type ApiNotificationRead = {
  id: string;
  isRead: boolean;
  readAt: string;
};

export type ApiReadAllNotifications = {
  updatedCount: number;
  unreadCount: number;
};

export type ApiProvider = {
  id: string;
  name: string;
  ratingText: string;
  priceText: string;
  note: string;
};

export type ApiSelection = {
  id: string;
  type: string;
  typeLabel: string;
  category: string;
  title: string;
  label: string;
  isHighlighted: boolean;
  priceText: string;
  affiliateText: string;
  imageUrl: string | null;
  ratingText: string;
  reviewCountText: string;
  tags: string[];
  reason: string;
  fitFor: string;
  notice?: string | null;
  checks?: string[] | null;
  isSaved: boolean;
  providers: ApiProvider[];
};

export type ApiSaveSelection = {
  selectionId: string;
  isSaved: boolean;
  savedAt: string;
};

export type ApiExternalView = {
  selectionId: string;
  providerId: string | null;
  externalUrl: string | null;
  notice: string;
};

export type ApiCommunityPostSummary = {
  id: string;
  type: "tips" | "qa";
  title: string;
  tag: string;
  bodyPreview: string;
  imageUrl: string | null;
  helpfulCount: number;
  commentsCount: number;
  answersCount: number;
  savedCount: number;
  isPopular: boolean;
  isSaved: boolean;
  createdAt: string;
};

export type ApiCommunityPostDetail = {
  id: string;
  type: "tips" | "qa";
  title: string;
  tag: string;
  body: string;
  imageUrl: string | null;
  helpfulCount: number;
  commentsCount: number;
  answersCount: number;
  savedCount: number;
  isSaved: boolean;
  hasMarkedHelpful: boolean;
  createdAt: string;
};

export type ApiCommunityComment = {
  id: string;
  postId: string;
  authorName: string;
  authorIsMe: boolean;
  body: string;
  createdAt: string;
};

export type ApiHelpful = {
  postId: string;
  hasMarkedHelpful: boolean;
  helpfulCount: number;
};

export type ApiSavePost = {
  postId: string;
  isSaved: boolean;
  savedAt: string;
};

export type ApiWeeklyFootprint = {
  weekStartDate: string;
  completionCount: number;
  level: number;
};

export type ApiProfile = {
  id: string;
  name: string;
  avatarText: string;
};

export type ApiMeSummary = {
  profile: ApiProfile;
  stats: {
    monthlyCompletionCount: number;
    categoryCount: number;
    savedSelectionCount: number;
  };
  weeklyFootprints: ApiWeeklyFootprint[];
  recentLogs: ApiCompletionLog[];
  savedSelections: ApiSelection[];
};

export type ApiUser = ApiProfile & {
  timezone: string;
  createdAt: string;
};

export type ApiDemoDataReset = {
  message: string;
  scripts: string[];
  tableCounts: Record<string, number>;
};

type QueryValue = string | number | undefined | null;

function withQuery(path: string, query: Record<string, QueryValue>) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value));
    }
  });
  const suffix = params.toString();
  return suffix ? `${path}?${suffix}` : path;
}

async function requestEnvelope<T>(path: string, init?: RequestInit): Promise<ApiEnvelope<T>> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });

  if (response.status === 204) {
    return { data: undefined as T, meta: {} };
  }

  const body = (await response.json().catch(() => null)) as (ApiEnvelope<T> & ApiErrorEnvelope) | null;
  if (!response.ok) {
    throw new Error(body?.error?.message ?? `요청에 실패했습니다. (${response.status})`);
  }
  if (!body || !("data" in body)) {
    throw new Error("서버 응답 형식이 올바르지 않습니다.");
  }
  return body;
}

async function requestData<T>(path: string, init?: RequestInit) {
  return (await requestEnvelope<T>(path, init)).data;
}

async function requestPage<T>(path: string): Promise<ApiPage<T>> {
  const response = await requestEnvelope<T[]>(path);
  return { items: response.data, nextCursor: response.meta.nextCursor ?? null };
}

export const getHome = () => requestData<ApiHome>("/api/v1/home");
export const getCategoryPresets = () => requestData<ApiCategoryPreset[]>("/api/v1/category-presets");

export function createCategoryFromPreset(presetKey: string) {
  return requestData<ApiCategory>("/api/v1/categories", {
    method: "POST",
    body: JSON.stringify({ presetKey }),
  });
}

export function updateCategoryCycle(categoryId: string, cycleDays: number) {
  return requestData<ApiCategory>(`/api/v1/categories/${categoryId}`, {
    method: "PATCH",
    body: JSON.stringify({ cycleDays }),
  });
}

export const deleteCategory = (categoryId: string) =>
  requestData<void>(`/api/v1/categories/${categoryId}`, { method: "DELETE" });

export function completeCategoryById(categoryId: string) {
  return requestData<ApiCompleteCategoryResult>(`/api/v1/categories/${categoryId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export const getNotifications = () => requestData<ApiNotificationList>("/api/v1/notifications");
export const readNotification = (notificationId: string) =>
  requestData<ApiNotificationRead>(`/api/v1/notifications/${notificationId}/read`, { method: "POST" });
export const readAllNotifications = () =>
  requestData<ApiReadAllNotifications>("/api/v1/notifications/read-all", { method: "PUT" });

export function getCompletionLogs(query: { limit?: number; cursor?: string; from?: string; to?: string } = {}) {
  return requestPage<ApiCompletionLog>(withQuery("/api/v1/completion-logs", query));
}

export const getMeSummary = () => requestData<ApiMeSummary>("/api/v1/me/summary");

export function getSelections(query: { category?: string; type?: string; cursor?: string; limit?: number } = {}) {
  return requestPage<ApiSelection>(withQuery("/api/v1/selections", query));
}

export const getSelection = (selectionId: string) =>
  requestData<ApiSelection>(`/api/v1/selections/${selectionId}`);
export const saveSelection = (selectionId: string) =>
  requestData<ApiSaveSelection>(`/api/v1/selections/${selectionId}/save`, { method: "PUT" });
export const unsaveSelection = (selectionId: string) =>
  requestData<void>(`/api/v1/selections/${selectionId}/save`, { method: "DELETE" });
export const recordExternalView = (selectionId: string, providerId?: string) =>
  requestData<ApiExternalView>(`/api/v1/selections/${selectionId}/external-view`, {
    method: "POST",
    body: JSON.stringify(providerId ? { providerId } : {}),
  });
export const getSavedSelections = () =>
  requestData<ApiSelection[]>("/api/v1/me/saved-selections");

export function getCommunityPosts(query: {
  type: "tips" | "qa";
  tag?: string;
  cursor?: string;
  limit?: number;
}) {
  return requestPage<ApiCommunityPostSummary>(withQuery("/api/v1/community/posts", query));
}

export function createCommunityPost(input: { type: "tips" | "qa"; title: string; tag?: string; body: string }) {
  return requestData<ApiCommunityPostDetail>("/api/v1/community/posts", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export const getCommunityPost = (postId: string) =>
  requestData<ApiCommunityPostDetail>(`/api/v1/community/posts/${postId}`);

export function getCommunityComments(postId: string, query: { cursor?: string; limit?: number } = {}) {
  return requestPage<ApiCommunityComment>(withQuery(`/api/v1/community/posts/${postId}/comments`, query));
}

export function createCommunityComment(postId: string, body: string) {
  return requestData<ApiCommunityComment>(`/api/v1/community/posts/${postId}/comments`, {
    method: "POST",
    body: JSON.stringify({ body }),
  });
}

export const markCommunityHelpful = (postId: string) =>
  requestData<ApiHelpful>(`/api/v1/community/posts/${postId}/helpful`, { method: "PUT" });
export const unmarkCommunityHelpful = (postId: string) =>
  requestData<ApiHelpful>(`/api/v1/community/posts/${postId}/helpful`, { method: "DELETE" });
export const saveCommunityPost = (postId: string) =>
  requestData<ApiSavePost>(`/api/v1/community/posts/${postId}/save`, { method: "PUT" });
export const unsaveCommunityPost = (postId: string) =>
  requestData<void>(`/api/v1/community/posts/${postId}/save`, { method: "DELETE" });

export const getMe = () => requestData<ApiUser>("/api/v1/me");
export const updateMe = (input: { name?: string; avatarText?: string }) =>
  requestData<ApiUser>("/api/v1/me", { method: "PATCH", body: JSON.stringify(input) });

export const resetDemoDataToSeed = () =>
  requestData<ApiDemoDataReset>("/api/v1/admin/demo-data/reset", { method: "POST", body: JSON.stringify({}) });
