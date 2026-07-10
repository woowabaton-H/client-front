"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  completeCategoryById,
  createCategoryFromPreset,
  getCategoryPresets,
  getHome,
  updateCategoryCycle,
  type ApiCategory,
  type ApiCategoryPreset,
  type ApiCompletionLog,
} from "@/lib/cleanloop-api";

type View = "home" | "selection" | "community" | "community-detail" | "my";
type CommunityTab = "tips" | "qa";
type StatusKey = "late" | "due" | "soon" | "good" | "doneToday";

type Category = {
  id: string;
  category: string;
  name: string;
  icon: string;
  cycleDays: number;
  lastDoneAt: string;
  nextDueAt?: string;
  note: string;
  status?: {
    code: "due" | "soon" | "good";
    label: string;
    daysUntilNext: number;
  };
};

type Log = {
  id: string | number;
  categoryName: string;
  icon: string;
  date: string;
  method: string;
};

type SelectionItem = {
  id: string;
  type: "product" | "service";
  category: string;
  icon: string;
  title: string;
  price: string;
  rating: string;
  reviews: string;
  source: string;
  image?: string;
  summary: string;
  fitFor: string;
  checks: string[];
  tags: string[];
  highlight?: boolean;
};

type CommunityPost = {
  id: string;
  title: string;
  category: string;
  tag: string;
  icon: string;
  body: string;
  helpful: number;
  comments: number;
  saved: number;
  time: string;
  level: string;
  safety: string;
  steps: string[];
  answers: string[];
  relatedSelectionIds: string[];
  authored?: boolean;
  helpedByMe?: boolean;
  savedByMe?: boolean;
};

type Sheet = {
  step: string;
  title: string;
  sub?: string;
  body?: React.ReactNode;
  kind?: "cycleManager";
};

type CycleDraft = Record<string, { enabled: boolean; cycleDays: number }>;
type SyncState = "loading" | "ready" | "error";
type CategoryPreset = {
  id: string;
  name: string;
  icon: string;
  defaultCycle: number;
  lastDoneDaysAgo: number;
  note: string;
};

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const TODAY = new Date();
const ALLOWED_CYCLE_DAYS = [3, 7, 14, 21, 28] as const;

const iconPath = (name: string) => `/cleanloop/icons/category-${name}.png`;

const categoryPresets: CategoryPreset[] = [
  { id: "laundry", name: "세탁/침구", icon: "laundry", defaultCycle: 14, lastDoneDaysAgo: 17, note: "수건 냄새와 침구 먼지를 같이 챙겨요." },
  { id: "bath", name: "욕실", icon: "bath", defaultCycle: 14, lastDoneDaysAgo: 14, note: "물때와 습기만 잡아도 관리가 쉬워져요." },
  { id: "kitchen", name: "주방", icon: "kitchen", defaultCycle: 7, lastDoneDaysAgo: 7, note: "배수구와 조리대 표면을 기준으로 잡아요." },
  { id: "trash", name: "쓰레기/수거", icon: "trash", defaultCycle: 3, lastDoneDaysAgo: 2, note: "배출 요일과 냄새 관리를 가볍게 묶어요." },
  { id: "floor", name: "바닥/먼지", icon: "floor", defaultCycle: 7, lastDoneDaysAgo: 6, note: "먼지와 머리카락은 쌓이기 전에 짧게 챙겨요." },
  { id: "season", name: "계절/가전", icon: "season", defaultCycle: 28, lastDoneDaysAgo: 16, note: "필터와 계절 가전은 한 달 리듬으로 봐요." },
  { id: "pet", name: "반려동물", icon: "pet", defaultCycle: 7, lastDoneDaysAgo: 2, note: "털과 냄새 루틴을 따로 기억해둘게요." },
  { id: "supplies", name: "소모품", icon: "supplies", defaultCycle: 14, lastDoneDaysAgo: 9, note: "세제, 봉투, 필터처럼 떨어지기 쉬운 물건을 확인해요." },
];

const initialCategories: Category[] = [
  categoryPresets[0],
  categoryPresets[1],
  categoryPresets[2],
].map((preset) => ({
  id: preset.id,
  category: preset.name,
  name: preset.name,
  icon: preset.icon,
  cycleDays: preset.defaultCycle,
  lastDoneAt: addDays(TODAY, -preset.lastDoneDaysAgo).toISOString(),
  note: preset.note,
}));

const initialLogs: Log[] = [
  { id: 1, categoryName: "쓰레기/수거", icon: "trash", date: "2026-07-08T21:00:00+09:00", method: "직접 완료" },
  { id: 2, categoryName: "바닥/먼지", icon: "floor", date: "2026-07-04T18:00:00+09:00", method: "직접 완료" },
  { id: 3, categoryName: "주방", icon: "kitchen", date: "2026-07-03T20:00:00+09:00", method: "직접 완료" },
  { id: 4, categoryName: "욕실", icon: "bath", date: "2026-06-26T09:00:00+09:00", method: "직접 완료" },
  { id: 5, categoryName: "세탁/침구", icon: "laundry", date: "2026-06-23T12:00:00+09:00", method: "서비스 이용" },
];

const selectionItems: SelectionItem[] = [
  {
    id: "downy-odor",
    type: "product",
    category: "세탁/침구",
    icon: "laundry",
    title: "다우니 오도 프로텍트 부스터",
    price: "12,900원대",
    rating: "4.8",
    reviews: "2,184",
    source: "쿠팡",
    image: "/cleanloop/images/downy.jpg",
    summary: "운동복과 수건 냄새 관리에 쓰는 세탁 향 부스터",
    fitFor: "세탁 후에도 냄새가 남는 수건이나 운동복 관리",
    checks: ["세탁조에 직접 넣는 제품인지 확인하세요.", "향이 강할 수 있어 소량부터 쓰는 편이 안전합니다."],
    tags: ["세탁 냄새", "수건", "운동복"],
    highlight: true,
  },
  {
    id: "downy-light",
    type: "product",
    category: "세탁/침구",
    icon: "laundry",
    title: "다우니 라이트 오션 미스트",
    price: "18,900원대",
    rating: "4.7",
    reviews: "1,063",
    source: "네이버쇼핑",
    image: "/cleanloop/images/laundry.jpeg",
    summary: "향이 과하지 않은 타입의 세탁 향 부스터 2개 구성",
    fitFor: "강한 향보다 가벼운 세탁 향을 선호할 때",
    checks: ["묶음 수량과 용량을 구매처에서 확인하세요.", "민감한 피부라면 사용량을 줄여 테스트하세요."],
    tags: ["2개 구성", "가벼운 향"],
  },
  {
    id: "laundrego-bedding",
    type: "service",
    category: "세탁/침구",
    icon: "laundry",
    title: "런드리고 침구 수거",
    price: "이불 16,000원대",
    rating: "4.7",
    reviews: "2,051",
    source: "런드리고",
    summary: "부피 큰 침구를 문앞에서 수거하고 다시 배송하는 서비스",
    fitFor: "집 세탁기로 이불 세탁이 부담스럽거나 건조 공간이 부족할 때",
    checks: ["수거 가능 지역을 먼저 확인하세요.", "품목과 소재에 따라 가격이 달라질 수 있습니다."],
    tags: ["수거 배송", "침구"],
    highlight: true,
  },
  {
    id: "today-pickup",
    type: "service",
    category: "쓰레기/수거",
    icon: "trash",
    title: "오늘수거 정기 수거",
    price: "월 9,900원부터",
    rating: "4.9",
    reviews: "3,105",
    source: "오늘수거",
    summary: "주 1~2회 문앞 수거로 배출 요일을 놓치지 않게 돕는 서비스",
    fitFor: "퇴근 시간이 늦어 쓰레기 배출이 자주 밀릴 때",
    checks: ["건물 출입 방식과 수거 가능 지역을 확인하세요.", "분리배출 기준은 지역별로 다를 수 있습니다."],
    tags: ["정기 수거", "문앞"],
  },
  {
    id: "miso-aircon",
    type: "service",
    category: "계절/가전",
    icon: "season",
    title: "미소 에어컨 청소",
    price: "79,000원대부터",
    rating: "4.7",
    reviews: "2,312",
    source: "미소",
    summary: "송풍팬과 열교환기까지 분해 청소를 예약하는 방문 서비스",
    fitFor: "냄새가 심하거나 냉방 시즌 전에 깊게 청소하고 싶을 때",
    checks: ["기종에 따라 가격이 달라집니다.", "예약 전 포함 범위를 확인하세요."],
    tags: ["방문 예약", "분해청소"],
    highlight: true,
  },
  {
    id: "bath-squeegee",
    type: "product",
    category: "욕실",
    icon: "bath",
    title: "욕실 스퀴지 세트",
    price: "8,900원대",
    rating: "4.6",
    reviews: "924",
    source: "네이버쇼핑",
    summary: "샤워 후 벽면과 거울 물기를 빠르게 밀어내는 기본 도구",
    fitFor: "물때가 자주 생기는 욕실에서 세제를 줄이고 싶을 때",
    checks: ["고무날 폭과 걸이 방식을 확인하세요.", "거울 표면에 흠집이 생기지 않게 깨끗한 상태로 쓰세요."],
    tags: ["물때", "물기 제거"],
  },
  {
    id: "kitchen-drain-net",
    type: "product",
    category: "주방",
    icon: "kitchen",
    title: "싱크대 배수구 거름망",
    price: "6,500원대",
    rating: "4.7",
    reviews: "1,420",
    source: "쿠팡",
    summary: "음식물 찌꺼기와 냄새 관리를 쉽게 만드는 교체형 소모품",
    fitFor: "배수구 청소가 자주 부담스럽고 냄새가 빨리 올라올 때",
    checks: ["사용 중인 배수구 지름과 호환되는지 확인하세요.", "촘촘한 타입은 물빠짐이 느릴 수 있습니다."],
    tags: ["배수구", "냄새"],
  },
  {
    id: "floor-roller",
    type: "product",
    category: "바닥/먼지",
    icon: "floor",
    title: "리필형 롤클리너",
    price: "9,900원대",
    rating: "4.8",
    reviews: "3,018",
    source: "오늘의집",
    summary: "머리카락과 큰 먼지를 물걸레 전 먼저 걷어내는 도구",
    fitFor: "바닥 청소 전에 머리카락이 자주 밀릴 때",
    checks: ["강한 접착 타입은 러그나 매트에 맞지 않을 수 있습니다.", "리필 규격이 같은지 확인하세요."],
    tags: ["머리카락", "먼지"],
  },
  {
    id: "supplies-refill-kit",
    type: "product",
    category: "소모품",
    icon: "supplies",
    title: "청소 소모품 리필 체크 키트",
    price: "15,900원대",
    rating: "4.5",
    reviews: "612",
    source: "마켓컬리",
    summary: "종량제 봉투, 장갑, 리필포처럼 자주 떨어지는 물건을 묶어 확인하는 구성",
    fitFor: "청소하려고 할 때 소모품이 없어 자주 멈출 때",
    checks: ["지역별 종량제 봉투 규격은 직접 확인하세요.", "구성품은 판매처 옵션에 따라 달라질 수 있습니다."],
    tags: ["리필", "재고 확인"],
  },
];

const community: Record<CommunityTab, CommunityPost[]> = {
  tips: [
    {
      id: "tip1",
      title: "욕실 물때는 세제보다 물기 제거가 먼저입니다",
      category: "욕실",
      tag: "욕실",
      icon: "bath",
      body: "샤워 후 벽면과 거울의 물기를 바로 제거하면 물때가 쌓이는 속도가 확실히 느려집니다.",
      helpful: 128,
      comments: 24,
      saved: 64,
      time: "3분",
      level: "쉬움",
      safety: "환기",
      steps: ["벽면 위쪽부터 아래로 물기를 내립니다.", "수전 주변은 마른 천으로 한 번 더 닦습니다.", "스퀴지는 세워서 말립니다."],
      answers: ["물때 제거제를 매일 쓰는 것보다 물기 제거를 먼저 해보세요.", "거울 얼룩은 마른 극세사 천으로 마무리하면 덜 남습니다."],
      relatedSelectionIds: ["bath-squeegee"],
    },
    {
      id: "tip2",
      title: "음식물 쓰레기는 탈취보다 배출 주기가 먼저입니다",
      category: "쓰레기/수거",
      tag: "수거",
      icon: "trash",
      body: "여름에는 탈취제를 추가하는 것보다 배출 간격을 줄이는 쪽이 냄새 재발을 줄이는 데 효과적입니다.",
      helpful: 104,
      comments: 18,
      saved: 43,
      time: "5분",
      level: "쉬움",
      safety: "냄새",
      steps: ["작은 봉투로 나눠 담습니다.", "물기를 최대한 빼고 밀봉합니다.", "배출 요일 전날 알림을 걸어둡니다."],
      answers: ["냉동 보관은 전용 용기를 써야 합니다.", "탈취제는 보조 수단으로만 두는 편이 좋습니다."],
      relatedSelectionIds: ["today-pickup", "supplies-refill-kit"],
    },
    {
      id: "tip3",
      title: "수건 냄새는 세탁조와 건조 시간을 같이 봅니다",
      category: "세탁/침구",
      tag: "세탁",
      icon: "laundry",
      body: "향 제품을 더 넣기 전에 세탁조, 고무패킹, 건조 시간을 차례대로 보면 원인을 좁히기 쉽습니다.",
      helpful: 118,
      comments: 21,
      saved: 58,
      time: "10분",
      level: "보통",
      safety: "세탁조",
      steps: ["세탁조 클리너 사용 주기를 확인합니다.", "고무패킹 사이 물때를 닦습니다.", "수건은 세탁 후 바로 널거나 건조합니다."],
      answers: ["세제 양이 많아도 냄새가 남을 수 있습니다.", "향 부스터는 원인 확인 후 보조로 쓰는 편이 좋습니다."],
      relatedSelectionIds: ["downy-odor", "downy-light", "laundrego-bedding"],
    },
    {
      id: "tip4",
      title: "물걸레 전 롤클리너 한 번이면 바닥 청소가 줄어듭니다",
      category: "바닥/먼지",
      tag: "바닥",
      icon: "floor",
      body: "머리카락과 큰 먼지를 먼저 걷어내면 물걸레가 밀리지 않고 바닥 자국도 덜 남습니다.",
      helpful: 91,
      comments: 15,
      saved: 38,
      time: "5분",
      level: "쉬움",
      safety: "바닥재",
      steps: ["방 입구에서 안쪽으로 롤클리너를 굴립니다.", "먼지가 많은 모서리를 먼저 정리합니다.", "마지막에 물걸레를 가볍게 사용합니다."],
      answers: ["강한 접착 롤러는 일부 러그나 매트에 붙을 수 있습니다.", "마루는 물걸레 물기를 많이 짜서 쓰는 편이 안전합니다."],
      relatedSelectionIds: ["floor-roller"],
    },
  ],
  qa: [
    {
      id: "qa1",
      title: "대리석 세면대에 물때 제거제를 써도 되나요?",
      category: "욕실",
      tag: "욕실",
      icon: "bath",
      body: "산성 세제는 대리석 표면을 상하게 할 수 있습니다. 전용 세제 또는 중성세제를 먼저 확인하세요.",
      helpful: 88,
      comments: 6,
      saved: 22,
      time: "확인 필요",
      level: "주의",
      safety: "표면 손상",
      steps: ["제품 라벨에서 산성 여부를 확인합니다.", "눈에 띄지 않는 곳에 먼저 테스트합니다.", "확신이 없으면 중성세제로 시작합니다."],
      answers: ["대리석에는 산성 세제를 피하는 편이 안전합니다.", "연마제가 든 제품도 광택을 해칠 수 있습니다."],
      relatedSelectionIds: ["bath-squeegee"],
    },
    {
      id: "qa2",
      title: "수건 냄새가 세탁 후에도 남으면 뭘 먼저 봐야 하나요?",
      category: "세탁/침구",
      tag: "세탁",
      icon: "laundry",
      body: "세탁조, 고무패킹, 건조 시간을 차례대로 확인해보라는 답변이 가장 많이 도움을 받았습니다.",
      helpful: 81,
      comments: 8,
      saved: 29,
      time: "10분",
      level: "보통",
      safety: "세탁조",
      steps: ["세탁조 클리너 사용 주기를 확인합니다.", "고무패킹 사이 물때를 닦습니다.", "수건은 세탁 후 바로 널거나 건조합니다."],
      answers: ["세제 양이 많아도 냄새가 남을 수 있습니다.", "건조 시간이 길어지면 냄새가 다시 올라옵니다."],
      relatedSelectionIds: ["downy-odor", "downy-light"],
    },
  ],
};

function addDays(date: Date, days: number) {
  return new Date(date.getTime() + days * MS_PER_DAY);
}

function fmtDate(input: string | Date) {
  const date = typeof input === "string" ? new Date(input) : input;
  return `${date.getMonth() + 1}월 ${date.getDate()}일`;
}

function nextDate(category: Category) {
  if (category.nextDueAt) {
    return new Date(category.nextDueAt);
  }
  return addDays(new Date(category.lastDoneAt), category.cycleDays);
}

function daysUntilNext(category: Category) {
  if (category.status) {
    return category.status.daysUntilNext;
  }
  return Math.ceil((nextDate(category).getTime() - TODAY.getTime()) / MS_PER_DAY);
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function categoryStatus(category: Category): { key: StatusKey; days: number; label: string } {
  if (isSameDay(new Date(category.lastDoneAt), TODAY)) {
    return { key: "doneToday", days: 0, label: "오늘 반짝" };
  }
  if (category.status) {
    const days = category.status.daysUntilNext;
    if (days < 0) return { key: "late", days, label: "살짝 밀렸어요" };
    if (category.status.code === "due") return { key: "due", days, label: category.status.label };
    if (category.status.code === "soon") return { key: "soon", days, label: category.status.label };
    return { key: "good", days, label: category.status.label };
  }
  const left = daysUntilNext(category);
  if (left < 0) return { key: "late", days: left, label: "살짝 밀렸어요" };
  if (left === 0) return { key: "due", days: 0, label: "오늘 좋아요" };
  if (left <= 2) return { key: "soon", days: left, label: "곧 챙겨요" };
  return { key: "good", days: left, label: "아직 여유" };
}

function statusDateLabel(days: number) {
  if (days < 0) return `${Math.abs(days)}일 지남`;
  if (days === 0) return "오늘";
  return `${days}일 남음`;
}

function statusPriority(category: Category) {
  const order: Record<StatusKey, number> = { late: 0, due: 1, soon: 2, doneToday: 3, good: 4 };
  return order[categoryStatus(category).key];
}

function presetForCategory(categoryName: string) {
  return categoryPresets.find((category) => category.name === categoryName) ?? categoryPresets[0];
}

function relatedSelectionsForCategory(categoryName: string) {
  return selectionItems.filter((item) => item.category === categoryName).map((item) => item.id);
}

function mapApiCategory(category: ApiCategory): Category {
  return {
    id: category.id,
    category: category.name,
    name: category.name,
    icon: category.icon,
    cycleDays: category.cycleDays,
    lastDoneAt: category.lastDoneAt,
    nextDueAt: category.nextDueAt,
    note: category.note,
    status: category.status,
  };
}

function mapApiLog(log: ApiCompletionLog, categories: Category[]): Log {
  const category = categories.find((item) => item.id === log.categoryId || item.name === log.categoryName);
  const preset = presetForCategory(log.categoryName);

  return {
    id: log.id,
    categoryName: log.categoryName,
    icon: category?.icon ?? preset.icon,
    date: log.completedAt,
    method: "직접 완료",
  };
}

function mapApiPreset(preset: ApiCategoryPreset): CategoryPreset {
  return {
    id: preset.key,
    name: preset.name,
    icon: preset.icon,
    defaultCycle: preset.cycleDays,
    lastDoneDaysAgo: preset.cycleDays,
    note: preset.note,
  };
}

function findCategoryForPreset(preset: CategoryPreset, items: Category[]) {
  return items.find((category) => category.name === preset.name);
}

function normalizeCycleDays(cycleDays: number) {
  return ALLOWED_CYCLE_DAYS.reduce((closest, value) => (
    Math.abs(value - cycleDays) < Math.abs(closest - cycleDays) ? value : closest
  ));
}

function stepCycleDays(current: number, direction: -1 | 1) {
  const currentIndex = ALLOWED_CYCLE_DAYS.findIndex((value) => value === normalizeCycleDays(current));
  const nextIndex = Math.max(0, Math.min(ALLOWED_CYCLE_DAYS.length - 1, currentIndex + direction));
  return ALLOWED_CYCLE_DAYS[nextIndex];
}

function errorMessageOf(error: unknown) {
  return error instanceof Error ? error.message : "잠시 후 다시 시도해주세요.";
}

function IconTile({ icon, size = 48 }: { icon: string; size?: number }) {
  return (
    <span className="category-icon" style={{ width: size, height: size }} aria-hidden="true">
      <Image src={iconPath(icon)} alt="" width={size} height={size} />
    </span>
  );
}

export function CleanLoopApp() {
  const [view, setView] = useState<View>("home");
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [logs, setLogs] = useState<Log[]>(initialLogs);
  const [cyclePresets, setCyclePresets] = useState<CategoryPreset[]>(categoryPresets);
  const [selectionFilter, setSelectionFilter] = useState("전체");
  const [communityTab, setCommunityTab] = useState<CommunityTab>("tips");
  const [communityCategoryFilter, setCommunityCategoryFilter] = useState("전체");
  const [communityPosts, setCommunityPosts] = useState<Record<CommunityTab, CommunityPost[]>>(community);
  const [activePostId, setActivePostId] = useState<string | null>(null);
  const [savedSelections, setSavedSelections] = useState<string[]>(["downy-odor"]);
  const [sheet, setSheet] = useState<Sheet | null>(null);
  const [cycleManagerEditing, setCycleManagerEditing] = useState(false);
  const [cycleDraft, setCycleDraft] = useState<CycleDraft>({});
  const [syncState, setSyncState] = useState<SyncState>("loading");
  const [syncMessage, setSyncMessage] = useState("서버에서 주기 데이터를 불러오는 중입니다.");
  const [pendingCategoryId, setPendingCategoryId] = useState<string | null>(null);
  const [cycleSaving, setCycleSaving] = useState(false);
  const [toast, setToast] = useState<{ title: string; desc?: string } | null>(null);
  const [hasUnreadNotification, setHasUnreadNotification] = useState(true);

  const loadCycleData = useCallback(async (showLoading = true) => {
    if (showLoading) {
      setSyncState("loading");
      setSyncMessage("서버에서 주기 데이터를 불러오는 중입니다.");
    }

    try {
      const [home, presets] = await Promise.all([getHome(), getCategoryPresets()]);
      const nextCategories = home.categories.map(mapApiCategory);
      setCategories(nextCategories);
      setLogs(home.recentLogs.map((log) => mapApiLog(log, nextCategories)));
      setCyclePresets(presets.map(mapApiPreset));
      setSyncState("ready");
      setSyncMessage(home.message);
      setHasUnreadNotification(home.categories.some((category) => category.status.daysUntilNext <= 0));
    } catch (error) {
      setSyncState("error");
      setSyncMessage(errorMessageOf(error));
    }
  }, []);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      void loadCycleData();
    }, 0);

    return () => window.clearTimeout(handle);
  }, [loadCycleData]);

  const sortedCategories = useMemo(
    () => categories.slice().sort((a, b) => statusPriority(a) - statusPriority(b)),
    [categories],
  );

  const weeklyDone = useMemo(() => {
    const weekStart = addDays(TODAY, -6);
    return logs.filter((log) => {
      const date = new Date(log.date);
      return date >= weekStart && date <= TODAY;
    }).length;
  }, [logs]);

  const showToast = (title: string, desc?: string) => {
    setToast({ title, desc });
    window.setTimeout(() => setToast(null), 2400);
  };

  const completeCategory = async (id: string) => {
    const category = categories.find((item) => item.id === id);
    if (!category) return;
    setPendingCategoryId(id);

    try {
      const result = await completeCategoryById(id);
      const updatedCategory = mapApiCategory(result.category);

      setCategories((items) => items.map((item) => (item.id === id ? updatedCategory : item)));
      setLogs((items) => [
        mapApiLog(result.log, [updatedCategory, ...categories]),
        ...items.filter((item) => item.id !== result.log.id),
      ]);
      setSyncState("ready");
      showToast("했어요", result.toastMessage);
    } catch (error) {
      showToast("완료 기록에 실패했어요", errorMessageOf(error));
    } finally {
      setPendingCategoryId(null);
    }
  };

  const createCycleDraft = (items: Category[], presets: CategoryPreset[]): CycleDraft => Object.fromEntries(
    presets.map((preset) => {
      const category = findCategoryForPreset(preset, items);
      return [
        preset.id,
        {
          enabled: Boolean(category),
          cycleDays: normalizeCycleDays(category?.cycleDays ?? preset.defaultCycle),
        },
      ];
    }),
  );

  const updateCycleDraft = (presetId: string, cycleDays: number) => {
    const days = normalizeCycleDays(cycleDays);
    setCycleDraft((draft) => ({
      ...draft,
      [presetId]: {
        enabled: draft[presetId]?.enabled ?? false,
        cycleDays: days,
      },
    }));
  };

  const toggleCycleDraft = (presetId: string) => {
    const preset = cyclePresets.find((item) => item.id === presetId);
    const activeCategory = preset ? findCategoryForPreset(preset, categories) : null;
    if (activeCategory) return;

    setCycleDraft((draft) => ({
      ...draft,
      [presetId]: {
        enabled: !draft[presetId]?.enabled,
        cycleDays: draft[presetId]?.cycleDays ?? preset?.defaultCycle ?? 7,
      },
    }));
  };

  const startCycleEditing = () => {
    setCycleDraft(createCycleDraft(categories, cyclePresets));
    setCycleManagerEditing(true);
  };

  const cancelCycleEditing = () => {
    setCycleDraft(createCycleDraft(categories, cyclePresets));
    setCycleManagerEditing(false);
  };

  const saveCycleEditing = async () => {
    setCycleSaving(true);

    try {
      for (const preset of cyclePresets) {
        const draftItem = cycleDraft[preset.id];
        const activeCategory = findCategoryForPreset(preset, categories);

        if (activeCategory) {
          const nextCycleDays = draftItem?.cycleDays ?? activeCategory.cycleDays;
          if (nextCycleDays !== activeCategory.cycleDays) {
            await updateCategoryCycle(activeCategory.id, nextCycleDays);
          }
          continue;
        }

        if (draftItem?.enabled) {
          const created = await createCategoryFromPreset(preset.id);
          if (draftItem.cycleDays !== created.cycleDays) {
            await updateCategoryCycle(created.id, draftItem.cycleDays);
          }
        }
      }

      await loadCycleData(false);
      setCycleManagerEditing(false);
      showToast("주기 관리를 저장했어요", "서버 데이터가 홈에 반영됐습니다.");
    } catch (error) {
      showToast("주기 저장에 실패했어요", errorMessageOf(error));
    } finally {
      setCycleSaving(false);
    }
  };

  const openCycleManager = () => {
    setCycleManagerEditing(false);
    setCycleDraft(createCycleDraft(categories, cyclePresets));
    setSheet({
      step: "주기 관리",
      title: "관리할 카테고리",
      sub: "서버에 저장된 주기를 수정하고, 아직 없는 프리셋은 새로 추가할 수 있어요.",
      kind: "cycleManager",
    });
  };

  const openCommunityComposer = (tab: CommunityTab) => {
    const isQa = tab === "qa";
    setSheet({
      step: isQa ? "Q&A 작성" : "꿀팁 공유 작성",
      title: isQa ? "궁금한 청소 문제를 남겨요" : "내 청소 팁을 공유해요",
      sub: isQa
        ? "답변이 쌓이고 검토된 Q&A는 관리자가 꿀팁 공유로 옮길 수 있어요."
        : "직접 해본 방법과 주의할 점을 함께 남겨주세요.",
      body: (
        <form
          className="compose-form"
          onSubmit={(event) => {
            event.preventDefault();
            const form = new FormData(event.currentTarget);
            const category = String(form.get("category") || "세탁/침구");
            const title = String(form.get("title") || "").trim();
            const body = String(form.get("body") || "").trim();
            if (!title || !body) {
              showToast("제목과 내용을 확인해주세요", "둘 다 입력하면 등록할 수 있어요.");
              return;
            }
            const preset = presetForCategory(category);
            const post: CommunityPost = {
              id: `${tab}-${Date.now()}`,
              title,
              category,
              tag: category,
              icon: preset.icon,
              body,
              helpful: 0,
              comments: 0,
              saved: 0,
              time: "방금",
              level: isQa ? "답변 대기" : "내 팁",
              safety: isQa ? "운영 검토" : "경험 공유",
              steps: isQa ? ["답변이 달리면 이곳에서 확인할 수 있습니다."] : ["작성한 팁을 확인하고 필요한 내용을 보완하세요."],
              answers: isQa ? ["아직 답변이 없습니다."] : ["내가 작성한 팁입니다."],
              relatedSelectionIds: relatedSelectionsForCategory(category),
              authored: true,
            };
            setCommunityPosts((posts) => ({
              ...posts,
              [tab]: [post, ...posts[tab]],
            }));
            setCommunityTab(tab);
            setCommunityCategoryFilter(category);
            setSheet(null);
            showToast(isQa ? "질문을 저장했어요" : "팁을 저장했어요", "커뮤니티 목록에서 바로 확인할 수 있어요.");
          }}
        >
          <label>
            <span>카테고리</span>
            <select name="category" defaultValue={communityCategoryFilter === "전체" ? "세탁/침구" : communityCategoryFilter}>
              {categoryPresets.map((category) => (
                <option key={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label>
            <span>{isQa ? "질문 제목" : "팁 제목"}</span>
            <input name="title" placeholder={isQa ? "예: 수건 냄새가 계속 남아요" : "예: 욕실 물때를 줄이는 작은 루틴"} />
          </label>
          <label>
            <span>{isQa ? "궁금한 내용" : "공유할 내용"}</span>
            <textarea name="body" placeholder={isQa ? "상황, 사용한 제품, 재질을 함께 적으면 답변이 쉬워요." : "직접 해본 순서와 조심할 점을 적어주세요."} />
          </label>
          {isQa ? (
            <div className="community-note">
              좋은 답변이 붙은 Q&A는 운영 검토 후 꿀팁 공유로 이동될 수 있습니다.
            </div>
          ) : (
            <div className="community-note">
              안전하지 않은 세제 혼합, 과장된 제품 추천은 운영 기준에 따라 조정될 수 있습니다.
            </div>
          )}
          <button
            className="primary-button"
            type="submit"
          >
            등록하기
          </button>
        </form>
      ),
    });
  };

  const openSelectionDetail = (item: SelectionItem) => {
    const saved = savedSelections.includes(item.id);
    setSheet({
      step: item.type === "product" ? "상품 정보" : "서비스 정보",
      title: item.title,
      sub: `${item.category} · ${item.source}`,
      body: (
        <div className="sheet-stack">
          {item.image ? (
            <div className="detail-image">
              <Image src={item.image} alt={item.title} fill sizes="390px" />
            </div>
          ) : (
            <div className="preview-row">
              <IconTile icon={item.icon} />
              <div>
                <strong>{item.source}</strong>
                <span>{item.price}</span>
              </div>
            </div>
          )}
          <div className="detail-summary">
            <div><span>가격</span><strong>{item.price}</strong></div>
            <div><span>후기</span><strong>★ {item.rating} · {item.reviews}</strong></div>
            <div><span>{item.type === "product" ? "구매처" : "제공처"}</span><strong>{item.source}</strong></div>
          </div>
          <InfoBlock title="맞는 상황">{item.fitFor}</InfoBlock>
          <section className="info-block">
            <h3>확인할 점</h3>
            <ul>{item.checks.map((check) => <li key={check}>{check}</li>)}</ul>
          </section>
          <InfoBlock title="구매 전 확인">가격, 옵션, 배송비, 예약 가능 여부는 외부 구매처에서 달라질 수 있습니다.</InfoBlock>
          <div className="sheet-actions two">
            <button type="button" className="ghost-button" onClick={() => toggleSave(item.id)}>
              {saved ? "담김" : "담기"}
            </button>
            <button type="button" className="secondary-button" onClick={() => showToast("외부 확인", item.source)}>
              {item.type === "product" ? "구매처 보기" : "예약 정보"}
            </button>
          </div>
        </div>
      ),
    });
  };

  const toggleSave = (id: string) => {
    const item = selectionItems.find((entry) => entry.id === id);
    setSavedSelections((items) => {
      const exists = items.includes(id);
      showToast(exists ? "담아둔 목록에서 뺐어요" : "담아뒀어요", item?.title);
      return exists ? items.filter((entry) => entry !== id) : [...items, id];
    });
  };

  const openNotification = () => {
    setHasUnreadNotification(false);
    const due = sortedCategories.filter((category) => categoryStatus(category).days <= 0);
    setSheet({
      step: "알림",
      title: "오늘 기준 항목",
      sub: "꼭 필요할 때만 조용히 알려드릴게요.",
      body: (
        <div className="sheet-stack">
          {due.map((category) => (
            <div className="list-row" key={category.id}>
              <IconTile icon={category.icon} size={42} />
              <div>
                <strong>{category.name}</strong>
                <span>{statusDateLabel(categoryStatus(category).days)} · 다음 관리 {fmtDate(nextDate(category))}</span>
              </div>
              <button className="small-button" type="button" onClick={() => completeCategory(category.id)}>
                했어요
              </button>
            </div>
          ))}
        </div>
      ),
    });
  };

  const updateCommunityPost = (postId: string, updater: (post: CommunityPost) => CommunityPost) => {
    setCommunityPosts((posts) => ({
      tips: posts.tips.map((post) => (post.id === postId ? updater(post) : post)),
      qa: posts.qa.map((post) => (post.id === postId ? updater(post) : post)),
    }));
  };

  const toggleCommunityHelpful = (postId: string) => {
    updateCommunityPost(postId, (post) => ({
      ...post,
      helpedByMe: !post.helpedByMe,
      helpful: post.helpedByMe ? Math.max(0, post.helpful - 1) : post.helpful + 1,
    }));
  };

  const toggleCommunitySave = (postId: string) => {
    updateCommunityPost(postId, (post) => ({
      ...post,
      savedByMe: !post.savedByMe,
      saved: post.savedByMe ? Math.max(0, post.saved - 1) : post.saved + 1,
    }));
  };

  const addCommunityReply = (postId: string, text: string, kind: CommunityTab) => {
    const trimmed = text.trim();
    if (!trimmed) {
      showToast("내용을 입력해주세요", kind === "qa" ? "답글을 작성할 수 있어요." : "댓글을 작성할 수 있어요.");
      return;
    }
    updateCommunityPost(postId, (post) => ({
      ...post,
      comments: post.comments + 1,
      answers: [`내 ${kind === "qa" ? "답글" : "댓글"} · ${trimmed}`, ...post.answers],
    }));
    showToast(kind === "qa" ? "답글을 남겼어요" : "댓글을 남겼어요", "글 상세에 바로 반영됐습니다.");
  };

  const activePost = activePostId
    ? [...communityPosts.tips, ...communityPosts.qa].find((post) => post.id === activePostId)
    : null;
  const activePostKind: CommunityTab = activePostId && communityPosts.qa.some((post) => post.id === activePostId) ? "qa" : "tips";

  return (
    <div className="prototype-page">
      <div className="app-shell" role="application" aria-label="비누 프로토타입">
        <header className="app-header">
          <div className="brand">
            <div className="brand-mark" aria-hidden="true">✓</div>
            <div>
              <div className="brand-title">비누</div>
              <div className="brand-sub">비우는 루틴, 누리는 하루</div>
            </div>
          </div>
          <button className="icon-button" type="button" aria-label="알림" onClick={openNotification}>
            {hasUnreadNotification ? <span className="alert-dot" /> : null}
            <span aria-hidden="true">⌁</span>
          </button>
        </header>

        <main className="views">
          {view === "home" ? (
            <HomeView
              categories={sortedCategories}
              logs={logs}
              weeklyDone={weeklyDone}
              communityPosts={communityPosts}
              syncState={syncState}
              syncMessage={syncMessage}
              pendingCategoryId={pendingCategoryId}
              onComplete={completeCategory}
              onManageCycle={openCycleManager}
              onOpenSelection={(category) => {
                setSelectionFilter(category);
                setView("selection");
              }}
              onOpenCommunity={(post) => {
                setActivePostId(post.id);
                setCommunityTab(communityPosts.tips.some((item) => item.id === post.id) ? "tips" : "qa");
                setView("community-detail");
              }}
              onHelp={(name) => {
                setCommunityTab("tips");
                setCommunityCategoryFilter(name);
                setView("community");
                showToast("꿀팁으로 연결했어요", `${name} 팁을 모아봤어요.`);
              }}
            />
          ) : null}
          {view === "selection" ? (
            <SelectionView
              filter={selectionFilter}
              savedSelections={savedSelections}
              onFilter={setSelectionFilter}
              onToggleSave={toggleSave}
              onDetail={openSelectionDetail}
            />
          ) : null}
          {view === "community" ? (
            <CommunityView
              posts={communityPosts}
              tab={communityTab}
              categoryFilter={communityCategoryFilter}
              onTab={setCommunityTab}
              onCategoryFilter={setCommunityCategoryFilter}
              onWrite={openCommunityComposer}
              onOpen={(id) => {
                setActivePostId(id);
                setView("community-detail");
              }}
            />
          ) : null}
          {view === "community-detail" && activePost ? (
            <CommunityDetail
              post={activePost}
              kind={activePostKind}
              onBack={() => setView("community")}
              onHelpful={() => toggleCommunityHelpful(activePost.id)}
              onSave={() => toggleCommunitySave(activePost.id)}
              onReply={(text) => addCommunityReply(activePost.id, text, activePostKind)}
              onOpenSelection={() => {
                setSelectionFilter(activePost.category);
                setView("selection");
                showToast("관련 셀렉션입니다", activePost.category);
              }}
            />
          ) : null}
          {view === "my" ? (
            <MyView
              categories={categories}
              logs={logs}
              savedCount={savedSelections.length}
              savedCommunityPosts={[...communityPosts.tips, ...communityPosts.qa].filter((post) => post.savedByMe)}
              authoredCommunityPosts={[...communityPosts.tips, ...communityPosts.qa].filter((post) => post.authored)}
              onManageCycle={openCycleManager}
              onHistory={() => setSheet({ step: "마이", title: "완료 히스토리", body: <HistoryList logs={logs} /> })}
              onSaved={() => {
                const saved = selectionItems.filter((item) => savedSelections.includes(item.id));
                setSheet({
                  step: "마이",
                  title: "저장한 셀렉션",
                  sub: `${saved.length}개 담김`,
                  body: saved.length ? (
                    <div className="sheet-stack">{saved.map((item) => <SelectionCard key={item.id} item={item} saved onToggleSave={toggleSave} onDetail={openSelectionDetail} />)}</div>
                  ) : (
                    <EmptyState title="담은 셀렉션이 없습니다" desc="상품이나 서비스를 담으면 여기에서 다시 볼 수 있습니다." />
                  ),
                });
              }}
              onSavedCommunity={() => {
                const saved = [...communityPosts.tips, ...communityPosts.qa].filter((post) => post.savedByMe);
                setSheet({
                  step: "마이",
                  title: "저장한 커뮤니티",
                  sub: `${saved.length}개 저장됨`,
                  body: saved.length ? (
                    <CommunityPostList posts={saved} onOpen={(post) => {
                      setSheet(null);
                      setActivePostId(post.id);
                      setCommunityTab(communityPosts.tips.some((item) => item.id === post.id) ? "tips" : "qa");
                      setView("community-detail");
                    }} />
                  ) : (
                    <EmptyState title="저장한 글이 없습니다" desc="커뮤니티 글에서 저장을 누르면 여기에서 다시 볼 수 있습니다." />
                  ),
                });
              }}
              onAuthoredCommunity={() => {
                const authored = [...communityPosts.tips, ...communityPosts.qa].filter((post) => post.authored);
                setSheet({
                  step: "마이",
                  title: "내 커뮤니티 글",
                  sub: `${authored.length}개 작성됨`,
                  body: authored.length ? (
                    <CommunityPostList posts={authored} onOpen={(post) => {
                      setSheet(null);
                      setActivePostId(post.id);
                      setCommunityTab(communityPosts.tips.some((item) => item.id === post.id) ? "tips" : "qa");
                      setView("community-detail");
                    }} />
                  ) : (
                    <EmptyState title="작성한 글이 없습니다" desc="커뮤니티에서 팁이나 질문을 작성하면 이곳에 모입니다." />
                  ),
                });
              }}
            />
          ) : null}
        </main>

        <nav className="tabbar" aria-label="하단 네비게이션">
          {[
            ["home", "홈", "⌂"],
            ["selection", "셀렉션", "□"],
            ["community", "커뮤니티", "≡"],
            ["my", "마이", "○"],
          ].map(([key, label, icon]) => (
            <button
              key={key}
              className={`tab-button ${view === key || (view === "community-detail" && key === "community") ? "active" : ""}`}
              type="button"
              aria-current={view === key ? "page" : undefined}
              onClick={() => setView(key as View)}
            >
              <span className="tab-icon" aria-hidden="true">{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </nav>

        {sheet ? (
          <div
            className="sheet-backdrop"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheetTitle"
            onClick={() => {
              setSheet(null);
              setCycleManagerEditing(false);
            }}
          >
            <section className="sheet-panel" onClick={(event) => event.stopPropagation()}>
              <header className="sheet-header">
                <div>
                  <p className="eyebrow">{sheet.step}</p>
                  <h2 id="sheetTitle">{sheet.title}</h2>
                  {sheet.sub ? <p>{sheet.sub}</p> : null}
                </div>
                <div className="sheet-header-actions">
                  {sheet.kind === "cycleManager" ? (
                    cycleManagerEditing ? (
                      <>
                        <button className="sheet-text-action" type="button" onClick={cancelCycleEditing}>취소</button>
                        <button className="sheet-save-action" type="button" disabled={cycleSaving} onClick={saveCycleEditing}>
                          {cycleSaving ? "저장 중" : "저장"}
                        </button>
                      </>
                    ) : (
                      <button className="sheet-save-action" type="button" onClick={startCycleEditing}>주기 수정하기</button>
                    )
                  ) : null}
                  <button
                    className="icon-button"
                    type="button"
                    aria-label="닫기"
                    onClick={() => {
                      setSheet(null);
                      setCycleManagerEditing(false);
                    }}
                  >
                    ×
                  </button>
                </div>
              </header>
              <div className="sheet-body">
                {sheet.kind === "cycleManager" ? (
                  <CycleManager
                    categories={categories}
                    presets={cyclePresets}
                    draft={cycleDraft}
                    editing={cycleManagerEditing}
                    saving={cycleSaving}
                    onToggle={toggleCycleDraft}
                    onCycleChange={updateCycleDraft}
                  />
                ) : (
                  sheet.body
                )}
              </div>
            </section>
          </div>
        ) : null}

        {toast ? (
          <div className="toast" role="status" aria-live="polite">
            <span aria-hidden="true">✓</span>
            <div>
              <strong>{toast.title}</strong>
              {toast.desc ? <small>{toast.desc}</small> : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}

function HomeView({
  categories,
  logs,
  weeklyDone,
  communityPosts,
  syncState,
  syncMessage,
  pendingCategoryId,
  onComplete,
  onManageCycle,
  onOpenSelection,
  onOpenCommunity,
  onHelp,
}: {
  categories: Category[];
  logs: Log[];
  weeklyDone: number;
  communityPosts: Record<CommunityTab, CommunityPost[]>;
  syncState: SyncState;
  syncMessage: string;
  pendingCategoryId: string | null;
  onComplete: (id: string) => void | Promise<void>;
  onManageCycle: () => void;
  onOpenSelection: (category: string) => void;
  onOpenCommunity: (post: CommunityPost) => void;
  onHelp: (categoryName: string) => void;
}) {
  const nearest = categories[0];
  const dueCount = categories.filter((category) => categoryStatus(category).days <= 0).length;
  const popularSelections = selectionItems
    .slice()
    .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)) || Number(b.reviews.replaceAll(",", "")) - Number(a.reviews.replaceAll(",", "")))
    .slice(0, 2);
  const popularPosts = [...communityPosts.tips, ...communityPosts.qa]
    .slice()
    .sort((a, b) => Number(Boolean(b.authored)) - Number(Boolean(a.authored)) || b.helpful + b.saved - (a.helpful + a.saved))
    .slice(0, 2);
  return (
    <section className="view">
      <div className="home-dashboard">
        <div>
          <p className="eyebrow">2026년 7월 10일 금요일</p>
          <h1>보송님, 오늘은 여기만 봐도 충분해요</h1>
          <p>{syncState === "loading" || syncState === "error" ? syncMessage : "다 한 일은 했어요만 눌러주세요. 다음 주기는 제가 기억할게요."}</p>
        </div>
        <div className="today-chip"><strong>10</strong><span>금</span></div>
      </div>

      <div className="home-info-grid">
        <InfoTile value={categories.length} label="관리 중인 주기" />
        <InfoTile value={weeklyDone} label="최근 7일 완료" />
        <InfoTile value={nearest ? statusDateLabel(categoryStatus(nearest).days) : "-"} label={nearest ? `${nearest.name} 다음 관리` : "주기 관리에서 켜기"} />
        <InfoTile value={dueCount} label="오늘 기준 항목" />
      </div>

      <section className="section">
        <div className="section-head">
          <h2>청소 주기</h2>
          <button className="text-button" type="button" onClick={onManageCycle}>주기 관리</button>
        </div>
        <div className="stack">
          {categories.length ? categories.map((category) => (
            <CategoryCard
              key={category.id}
              category={category}
              busy={pendingCategoryId === category.id}
              onComplete={onComplete}
              onHelp={onHelp}
            />
          )) : <EmptyState title="켜둔 주기가 없습니다" desc="주기 관리에서 필요한 카테고리를 켜두면 홈에 표시됩니다." />}
        </div>
      </section>

      <section className="section compact">
        <div className="section-head">
          <h2>최근 완료</h2>
          <span className="muted">최신순</span>
        </div>
        <div className="history-strip">
          {logs.slice(0, 5).map((log) => (
            <article className="mini-log" key={log.id}>
              <IconTile icon={log.icon} size={34} />
              <strong>{log.categoryName}</strong>
              <span>{fmtDate(log.date)}</span>
            </article>
          ))}
        </div>
      </section>

      <section className="section compact">
        <div className="section-head">
          <h2>인기 셀렉션</h2>
          <span className="muted">많이 본 추천</span>
        </div>
        <div className="home-promo-list">
          {popularSelections.map((item) => (
            <button className="home-promo-card" key={item.id} type="button" onClick={() => onOpenSelection(item.category)}>
              <IconTile icon={item.icon} size={34} />
              <div>
                <strong>{item.title}</strong>
                <span>{item.category} · {item.price}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="section compact">
        <div className="section-head">
          <h2>인기 커뮤니티</h2>
          <span className="muted">도움 받은 글</span>
        </div>
        <div className="home-promo-list">
          {popularPosts.map((post) => (
            <button className="home-promo-card" key={post.id} type="button" onClick={() => onOpenCommunity(post)}>
              <IconTile icon={post.icon} size={34} />
              <div>
                <strong>{post.title}</strong>
                <span>{post.authored ? "내 글" : post.category} · 도움 {post.helpful}</span>
              </div>
            </button>
          ))}
        </div>
      </section>
    </section>
  );
}

function CategoryCard({
  category,
  busy,
  onComplete,
  onHelp,
}: {
  category: Category;
  busy: boolean;
  onComplete: (id: string) => void | Promise<void>;
  onHelp: (categoryName: string) => void;
}) {
  const status = categoryStatus(category);
  return (
    <article className={`task-card status-${status.key}`}>
      <div className="task-head">
        <IconTile icon={category.icon} />
        <div className="task-main">
          <span className="status-label">{status.label}</span>
          <h3>{category.name}</h3>
          <p>마지막 완료 {fmtDate(category.lastDoneAt)} · {category.cycleDays}일 주기 · 다음 관리 {fmtDate(nextDate(category))}</p>
        </div>
        <span className="status-pill">{statusDateLabel(status.days)}</span>
      </div>
      <p className="task-note">{category.note}</p>
      <div className="task-actions">
        <button className="primary-button" type="button" disabled={busy} onClick={() => onComplete(category.id)}>
          {busy ? "기록 중" : "했어요"}
        </button>
        <button className="secondary-button" type="button" onClick={() => onHelp(category.category)}>도움 볼래요</button>
      </div>
    </article>
  );
}

function SelectionView({
  filter,
  savedSelections,
  onFilter,
  onToggleSave,
  onDetail,
}: {
  filter: string;
  savedSelections: string[];
  onFilter: (filter: string) => void;
  onToggleSave: (id: string) => void;
  onDetail: (item: SelectionItem) => void;
}) {
  const filters = ["전체", ...categoryPresets.map((category) => category.name)];
  const items = filter === "전체" ? selectionItems : selectionItems.filter((item) => item.category === filter);
  return (
    <section className="view">
      <div className="selection-hero">
        <span>이번 주 추천</span>
        <h1>가격과 후기를 먼저 보고 골라요</h1>
        <p>상품과 서비스는 하나의 카드가 하나의 선택지가 되도록 정리했습니다.</p>
      </div>
      <div className="filter-row">
        {filters.map((item) => (
          <button className={`filter-chip ${filter === item ? "active" : ""}`} key={item} type="button" onClick={() => onFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="stack">
        {items.length ? items
          .slice()
          .sort((a, b) => Number(Boolean(b.highlight)) - Number(Boolean(a.highlight)))
          .map((item) => (
            <SelectionCard
              key={item.id}
              item={item}
              saved={savedSelections.includes(item.id)}
              onToggleSave={onToggleSave}
              onDetail={onDetail}
            />
          )) : <EmptyState title="아직 등록된 셀렉션이 없습니다" desc="상품 이미지를 확인한 항목부터 추가합니다." />}
      </div>
    </section>
  );
}

function SelectionCard({
  item,
  saved,
  onToggleSave,
  onDetail,
}: {
  item: SelectionItem;
  saved: boolean;
  onToggleSave: (id: string) => void;
  onDetail: (item: SelectionItem) => void;
}) {
  return (
    <article className={`selection-card ${item.highlight ? "featured" : ""}`}>
      {item.image ? (
        <div className="product-image">
          <Image src={item.image} alt={item.title} width={96} height={112} sizes="96px" />
        </div>
      ) : (
        <div className="product-image placeholder"><IconTile icon={item.icon} /></div>
      )}
      <div className="selection-info">
        <span>{item.category} · {item.type === "product" ? "상품" : "서비스"}</span>
        <h3>{item.title}</h3>
        <div className="selection-price">{item.price}</div>
        <div className="selection-rating">★ {item.rating} · 후기 {item.reviews}</div>
        <p>{item.summary}</p>
        <div className="store-line"><span>{item.type === "product" ? "구매처" : "제공처"}</span><strong>{item.source}</strong></div>
        <div className="tag-row">{item.tags.map((tag) => <span className="tag" key={tag}>{tag}</span>)}</div>
        <div className="card-actions">
          <button className="ghost-button" type="button" onClick={() => onToggleSave(item.id)}>{saved ? "담김" : "담기"}</button>
          <button className="secondary-button" type="button" onClick={() => onDetail(item)}>{item.type === "product" ? "구매처 보기" : "예약 정보"}</button>
        </div>
      </div>
    </article>
  );
}

function CommunityView({
  posts,
  tab,
  categoryFilter,
  onTab,
  onCategoryFilter,
  onWrite,
  onOpen,
}: {
  posts: Record<CommunityTab, CommunityPost[]>;
  tab: CommunityTab;
  categoryFilter: string;
  onTab: (tab: CommunityTab) => void;
  onCategoryFilter: (filter: string) => void;
  onWrite: (tab: CommunityTab) => void;
  onOpen: (id: string) => void;
}) {
  const filters = ["전체", ...categoryPresets.map((category) => category.name)];
  const visiblePosts = posts[tab]
    .filter((post) => categoryFilter === "전체" || post.category === categoryFilter)
    .slice()
    .sort((a, b) => Number(Boolean(b.authored)) - Number(Boolean(a.authored)) || b.helpful + b.saved - (a.helpful + a.saved));
  return (
    <section className="view">
      <div className="page-title">
        <p className="eyebrow">커뮤니티</p>
        <h1>막히는 청소 문제는 함께 해결해요</h1>
        <p>직접 글을 남기고, 검토된 Q&A는 꿀팁으로 다시 정리됩니다.</p>
      </div>
      <div className="segmented" role="tablist" aria-label="커뮤니티 분류">
        <button className={`segment ${tab === "tips" ? "active" : ""}`} type="button" onClick={() => onTab("tips")}>꿀팁 공유</button>
        <button className={`segment ${tab === "qa" ? "active" : ""}`} type="button" onClick={() => onTab("qa")}>Q&amp;A</button>
      </div>
      <div className="community-action-row">
        <p>{tab === "qa" ? "좋은 답변이 붙은 Q&A는 관리자가 꿀팁 공유로 옮겨요." : "경험 기반 팁을 카테고리별로 공유할 수 있어요."}</p>
        <button className="community-write-button" type="button" onClick={() => onWrite(tab)}>
          {tab === "qa" ? "질문하기" : "팁 쓰기"}
        </button>
      </div>
      <div className="filter-row">
        {filters.map((item) => (
          <button className={`filter-chip ${categoryFilter === item ? "active" : ""}`} key={item} type="button" onClick={() => onCategoryFilter(item)}>
            {item}
          </button>
        ))}
      </div>
      <div className="stack">
        {visiblePosts.length ? visiblePosts.map((post) => (
          <article className="community-card" key={post.id} onClick={() => onOpen(post.id)}>
            <div className="community-top">
              <IconTile icon={post.icon} />
              <div>
                <span className="pill">{post.authored ? "내 글" : tab === "qa" ? "Q&A" : "꿀팁"}</span>
                <h3>{post.title}</h3>
                <p className="meta">{post.category} · #{post.tag} · {post.level} · {post.time} · 도움 {post.helpful}</p>
              </div>
            </div>
            <p>{post.body}</p>
          </article>
        )) : <EmptyState title="아직 연결된 글이 없습니다" desc="카테고리별 팁은 검수된 내용부터 채워둘게요." />}
      </div>
    </section>
  );
}

function CommunityDetail({
  post,
  kind,
  onBack,
  onHelpful,
  onSave,
  onReply,
  onOpenSelection,
}: {
  post: CommunityPost;
  kind: CommunityTab;
  onBack: () => void;
  onHelpful: () => void;
  onSave: () => void;
  onReply: (text: string) => void;
  onOpenSelection: () => void;
}) {
  const relatedSelections = selectionItems.filter((item) => post.relatedSelectionIds.includes(item.id));
  return (
    <section className="view">
      <button className="back-button" type="button" onClick={onBack}>‹ 커뮤니티</button>
      <article className="community-detail">
        <header className="detail-head">
          <IconTile icon={post.icon} />
          <div>
            <p className="eyebrow">커뮤니티 · {post.category}</p>
            <h1>{post.title}</h1>
            <p className="meta">{post.level} · {post.time} · 도움 {post.helpful} · 저장 {post.saved} · {kind === "qa" ? "답글" : "댓글"} {post.comments}</p>
          </div>
        </header>
        <div className="community-reaction-row">
          <button className={post.helpedByMe ? "active" : ""} type="button" onClick={onHelpful}>
            도움 {post.helpful}
          </button>
          <button className={post.savedByMe ? "active" : ""} type="button" onClick={onSave}>
            {post.savedByMe ? "저장됨" : "저장"} {post.saved}
          </button>
        </div>
        <InfoBlock title="요약">{post.body}</InfoBlock>
        <section className="info-block">
          <h3>진행 순서</h3>
          <ol>{post.steps.map((step) => <li key={step}>{step}</li>)}</ol>
        </section>
        <InfoBlock title="확인 필요">{post.safety} 관련 내용은 재질과 제품 표기를 먼저 확인하세요.</InfoBlock>
        <section className="info-block">
          <h3>{kind === "qa" ? "답글과 답변" : "댓글"}</h3>
          <form
            className="reply-form"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onReply(String(form.get("reply") || ""));
              event.currentTarget.reset();
            }}
          >
            <input name="reply" placeholder={kind === "qa" ? "답글을 남겨주세요" : "댓글을 남겨주세요"} />
            <button type="submit">{kind === "qa" ? "답글" : "댓글"}</button>
          </form>
          <div className="answer-list">{post.answers.map((answer) => <p key={answer}>{answer}</p>)}</div>
        </section>
        <section className="info-block">
          <h3>관련 셀렉션</h3>
          {relatedSelections.length ? (
            <div className="related-selection-list">
              {relatedSelections.map((item) => (
                <button className="related-selection-row" key={item.id} type="button" onClick={onOpenSelection}>
                  <IconTile icon={item.icon} size={34} />
                  <span>{item.title}</span>
                  <strong>{item.price}</strong>
                </button>
              ))}
            </div>
          ) : (
            <p>아직 연결된 상품이나 서비스가 없습니다.</p>
          )}
        </section>
      </article>
    </section>
  );
}

function MyView({
  categories,
  logs,
  savedCount,
  savedCommunityPosts,
  authoredCommunityPosts,
  onManageCycle,
  onHistory,
  onSaved,
  onSavedCommunity,
  onAuthoredCommunity,
}: {
  categories: Category[];
  logs: Log[];
  savedCount: number;
  savedCommunityPosts: CommunityPost[];
  authoredCommunityPosts: CommunityPost[];
  onManageCycle: () => void;
  onHistory: () => void;
  onSaved: () => void;
  onSavedCommunity: () => void;
  onAuthoredCommunity: () => void;
}) {
  const levels = [1, 0, 2, 1, 0, 1, 2, 1, 3, 2, 2, Math.min(3, Math.max(1, logs.length - 3))];
  return (
    <section className="view">
      <div className="profile-band">
        <div className="avatar">보</div>
        <div>
          <p className="eyebrow">김보송님의 기록</p>
          <h1>청소발자국</h1>
          <p>내 청소 리듬을 짧게 보고, 자세한 기록은 메뉴에서 확인해요.</p>
        </div>
      </div>
      <div className="stats-grid">
        <InfoTile value={logs.length} label="이번 달 완료" />
        <InfoTile value={categories.length} label="사용 중인 주기" />
        <InfoTile value={savedCount} label="담은 셀렉션" />
        <InfoTile value={savedCommunityPosts.length} label="저장한 글" />
      </div>
      <section className="section">
        <div className="section-head">
          <h2>최근 12주</h2>
          <span className="muted">주간 완료 기록</span>
        </div>
        <div className="footprint-grid">
          {levels.map((level, index) => <span className={`foot-cell ${level ? `l${level}` : ""} ${index === levels.length - 1 ? "now" : ""}`} key={`${level}-${index}`} />)}
        </div>
      </section>
      <section className="section">
        <div className="section-head"><h2>메뉴</h2></div>
        <div className="menu-list">
          <button className="menu-row" type="button" onClick={onHistory}><span>완료 히스토리</span><strong>이번 달 {logs.length}개</strong><em>›</em></button>
          <button className="menu-row" type="button" onClick={onSaved}><span>저장한 셀렉션</span><strong>{savedCount}개 담김</strong><em>›</em></button>
          <button className="menu-row" type="button" onClick={onSavedCommunity}><span>저장한 커뮤니티</span><strong>{savedCommunityPosts.length}개 저장</strong><em>›</em></button>
          <button className="menu-row" type="button" onClick={onAuthoredCommunity}><span>내 커뮤니티 글</span><strong>{authoredCommunityPosts.length}개 작성</strong><em>›</em></button>
          <button className="menu-row" type="button" onClick={onManageCycle}><span>주기 관리</span><strong>{categories.length}개 사용 중</strong><em>›</em></button>
          <button className="menu-row" type="button"><span>알림 설정</span><strong>조용한 알림</strong><em>›</em></button>
        </div>
      </section>
    </section>
  );
}

function InfoTile({ value, label }: { value: string | number; label: string }) {
  return (
    <article className="info-tile">
      <strong>{value}</strong>
      <span>{label}</span>
    </article>
  );
}

function CycleManager({
  categories,
  presets,
  draft,
  editing,
  saving,
  onToggle,
  onCycleChange,
}: {
  categories: Category[];
  presets: CategoryPreset[];
  draft: CycleDraft;
  editing: boolean;
  saving: boolean;
  onToggle: (presetId: string) => void;
  onCycleChange: (presetId: string, cycleDays: number) => void;
}) {
  return (
    <div className="cycle-manager-list">
      {presets.map((preset) => {
        const activeCategory = findCategoryForPreset(preset, categories);
        const draftItem = draft[preset.id];
        const enabled = editing ? Boolean(draftItem?.enabled) : Boolean(activeCategory);
        const cycleDays = editing ? draftItem?.cycleDays ?? preset.defaultCycle : activeCategory?.cycleDays ?? preset.defaultCycle;
        const canChangeCycle = editing && enabled && !saving;
        const canToggle = editing && !activeCategory && !saving;
        return (
          <article className={`cycle-toggle-row ${enabled ? "enabled" : ""} ${editing ? "editing" : ""}`} key={preset.id}>
            <IconTile icon={preset.icon} size={42} />
            <div>
              <strong>{preset.name}</strong>
              <span>{activeCategory ? "서버에 저장됨" : enabled ? "저장하면 새 주기로 추가됨" : "아직 추가되지 않음"} · {cycleDays}일 주기 · {preset.note}</span>
              {editing ? (
                <div className="cycle-input-row">
                  <button type="button" disabled={!canChangeCycle || cycleDays === ALLOWED_CYCLE_DAYS[0]} onClick={() => onCycleChange(preset.id, stepCycleDays(cycleDays, -1))}>-</button>
                  <div className="cycle-choice-row" role="group" aria-label={`${preset.name} 주기 선택`}>
                    {ALLOWED_CYCLE_DAYS.map((days) => (
                      <button
                        key={days}
                        className={days === cycleDays ? "selected" : ""}
                        type="button"
                        disabled={!canChangeCycle}
                        onClick={() => onCycleChange(preset.id, days)}
                      >
                        {days}
                      </button>
                    ))}
                  </div>
                  <button type="button" disabled={!canChangeCycle || cycleDays === ALLOWED_CYCLE_DAYS[ALLOWED_CYCLE_DAYS.length - 1]} onClick={() => onCycleChange(preset.id, stepCycleDays(cycleDays, 1))}>+</button>
                </div>
              ) : null}
            </div>
            <button
              className={`toggle-switch ${enabled ? "on" : ""}`}
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`${preset.name} 주기 ${activeCategory ? "사용 중" : enabled ? "추가 취소" : "추가"}`}
              disabled={!canToggle}
              onClick={() => onToggle(preset.id)}
            >
              <span />
            </button>
          </article>
        );
      })}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="info-block">
      <h3>{title}</h3>
      <p>{children}</p>
    </section>
  );
}

function HistoryList({ logs }: { logs: Log[] }) {
  return (
    <div className="sheet-stack">
      {logs.map((log) => (
        <div className="list-row" key={log.id}>
          <IconTile icon={log.icon} size={42} />
          <div>
            <strong>{log.categoryName}</strong>
            <span>{fmtDate(log.date)} · {log.method}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommunityPostList({ posts, onOpen }: { posts: CommunityPost[]; onOpen: (post: CommunityPost) => void }) {
  return (
    <div className="sheet-stack">
      {posts.map((post) => (
        <button className="community-list-row" key={post.id} type="button" onClick={() => onOpen(post)}>
          <IconTile icon={post.icon} size={40} />
          <div>
            <strong>{post.title}</strong>
            <span>{post.category} · 도움 {post.helpful} · 저장 {post.saved}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="empty-state">
      <strong>{title}</strong>
      <span>{desc}</span>
    </div>
  );
}
