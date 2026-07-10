type ApiMeta = {
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

async function requestData<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(path, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  const body = (await response.json().catch(() => null)) as ApiEnvelope<T> & ApiErrorEnvelope | null;

  if (!response.ok) {
    const message = body?.error?.message ?? `요청에 실패했습니다. (${response.status})`;
    throw new Error(message);
  }

  if (!body || !("data" in body)) {
    throw new Error("서버 응답 형식이 올바르지 않습니다.");
  }

  return body.data;
}

export function getHome() {
  return requestData<ApiHome>("/api/v1/home");
}

export function getCategoryPresets() {
  return requestData<ApiCategoryPreset[]>("/api/v1/category-presets");
}

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

export function completeCategoryById(categoryId: string) {
  return requestData<ApiCompleteCategoryResult>(`/api/v1/categories/${categoryId}/complete`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}
