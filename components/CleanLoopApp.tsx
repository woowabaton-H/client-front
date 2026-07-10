"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Bell,
  Bookmark,
  BookmarkCheck,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  History,
  Home,
  MessageSquareHeart,
  MessagesSquare,
  Minus,
  PackageSearch,
  PenLine,
  Plus,
  Send,
  Settings2,
  Sparkles,
  Star,
  ThumbsUp,
  UserRound,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { BinuPickCard } from "@/components/binu/binu-pick-card";
import { EmptyState as BinuEmptyState } from "@/components/binu/empty-state";
import { RoutineCard } from "@/components/binu/routine-card";
import { ServiceCard } from "@/components/binu/service-card";
import { cn } from "@/lib/utils";
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
    <span className="relative grid shrink-0 place-items-center overflow-hidden rounded-lg border border-binu-line bg-binu-sky-soft" style={{ width: size, height: size }} aria-hidden="true">
      <Image src={iconPath(icon)} alt="" fill sizes={`${size}px`} className="object-cover" />
    </span>
  );
}

const navigationItems = [
  { key: "home", label: "홈", icon: Home },
  { key: "selection", label: "비누 픽", icon: PackageSearch },
  { key: "community", label: "커뮤니티", icon: MessagesSquare },
  { key: "my", label: "마이", icon: UserRound },
] as const;

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
          className="grid gap-4"
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
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-binu-navy">카테고리</span>
            <select className="h-10 w-full rounded-lg border border-binu-mist bg-white px-3 text-sm text-binu-ink outline-none focus:border-binu-sky focus:ring-3 focus:ring-binu-sky/40" name="category" defaultValue={communityCategoryFilter === "전체" ? "세탁/침구" : communityCategoryFilter}>
              {categoryPresets.map((category) => (
                <option key={category.id}>{category.name}</option>
              ))}
            </select>
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-binu-navy">{isQa ? "질문 제목" : "팁 제목"}</span>
            <Input className="h-10 bg-white" name="title" placeholder={isQa ? "예: 수건 냄새가 계속 남아요" : "예: 욕실 물때를 줄이는 작은 루틴"} />
          </label>
          <label className="grid gap-2">
            <span className="text-xs font-extrabold text-binu-navy">{isQa ? "궁금한 내용" : "공유할 내용"}</span>
            <Textarea className="min-h-28 bg-white" name="body" placeholder={isQa ? "상황, 사용한 제품, 재질을 함께 적으면 답변이 쉬워요." : "직접 해본 순서와 조심할 점을 적어주세요."} />
          </label>
          {isQa ? (
            <div className="rounded-lg border border-[#F6DDC5] bg-binu-cream p-3 text-xs leading-6 text-binu-text">
              좋은 답변이 붙은 Q&A는 운영 검토 후 꿀팁 공유로 이동될 수 있습니다.
            </div>
          ) : (
            <div className="rounded-lg border border-[#F6DDC5] bg-binu-cream p-3 text-xs leading-6 text-binu-text">
              안전하지 않은 세제 혼합, 과장된 제품 추천은 운영 기준에 따라 조정될 수 있습니다.
            </div>
          )}
          <Button variant="binu" size="lg" type="submit">
            등록하기
            <Send size={16} aria-hidden="true" />
          </Button>
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
        <div className="grid gap-4">
          {item.image ? (
            <div className="relative h-56 overflow-hidden rounded-lg border border-binu-line bg-white">
              <Image src={item.image} alt={item.title} fill sizes="390px" className="object-contain" />
            </div>
          ) : (
            <Card className="border-binu-line bg-white shadow-none">
              <CardContent className="flex items-center gap-3">
              <IconTile icon={item.icon} />
              <div>
                <strong className="block text-sm font-extrabold text-binu-ink">{item.source}</strong>
                <span className="mt-1 block text-xs font-bold text-binu-muted">{item.price}</span>
              </div>
              </CardContent>
            </Card>
          )}
          <div className="grid grid-cols-3 gap-2">
            <DetailMetric label="가격" value={item.price} />
            <DetailMetric label="후기" value={`${item.rating} · ${item.reviews}`} icon={<Star className="size-3 fill-[#F2C35E] text-[#F2C35E]" aria-hidden="true" />} />
            <DetailMetric label={item.type === "product" ? "구매처" : "제공처"} value={item.source} />
          </div>
          <InfoBlock title="맞는 상황">{item.fitFor}</InfoBlock>
          <Card size="sm" className="border-binu-line bg-background shadow-none">
            <CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">확인할 점</CardTitle></CardHeader>
            <CardContent><ul className="list-disc space-y-1 pl-4 text-xs leading-6 text-binu-text">{item.checks.map((check) => <li key={check}>{check}</li>)}</ul></CardContent>
          </Card>
          <InfoBlock title="구매 전 확인">가격, 옵션, 배송비, 예약 가능 여부는 외부 구매처에서 달라질 수 있습니다.</InfoBlock>
          <div className="grid grid-cols-2 gap-2">
            <Button type="button" variant={saved ? "binu-soft" : "quiet"} onClick={() => toggleSave(item.id)}>
              {saved ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
              {saved ? "담김" : "담기"}
            </Button>
            <Button type="button" variant="binu" onClick={() => showToast("외부 확인", item.source)}>
              {item.type === "product" ? "구매처 보기" : "예약 정보"}
              <ExternalLink size={16} aria-hidden="true" />
            </Button>
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
        <div className="grid gap-3">
          {due.map((category) => (
            <Card className="border-binu-line bg-white shadow-none" key={category.id}>
              <CardContent className="grid grid-cols-[42px_1fr_auto] items-center gap-3">
              <IconTile icon={category.icon} size={42} />
              <div className="min-w-0">
                <strong className="block text-xs font-extrabold text-binu-ink">{category.name}</strong>
                <span className="mt-1 block truncate text-[10px] font-bold text-binu-muted">{statusDateLabel(categoryStatus(category).days)} · 다음 관리 {fmtDate(nextDate(category))}</span>
              </div>
              <Button variant="binu" size="sm" type="button" onClick={() => completeCategory(category.id)}>
                <Check size={14} aria-hidden="true" />
                했어요
              </Button>
              </CardContent>
            </Card>
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
    <div className="flex min-h-dvh justify-center bg-[#DDEAF3] md:items-center md:py-5">
      <div className="relative min-h-dvh w-full max-w-[430px] overflow-hidden bg-background shadow-[0_24px_90px_rgba(46,75,102,0.22)] md:h-[min(900px,calc(100dvh-2.5rem))] md:min-h-[700px] md:rounded-[26px] md:border md:border-white/80">
        <header className="absolute inset-x-0 top-0 z-40 flex h-[74px] items-center justify-between border-b border-binu-line bg-background/90 px-5 backdrop-blur-xl">
          <div className="flex min-w-0 items-center gap-2.5">
            <Image
              className="size-10 shrink-0 rounded-[10px] shadow-[0_7px_18px_rgba(46,75,102,0.13)]"
              src="/binu/app-icon-soap-wordmark.svg"
              alt=""
              width={40}
              height={40}
              priority
            />
            <div>
              <div className="text-lg font-black leading-tight tracking-[-0.03em] text-binu-navy">비누</div>
              <div className="mt-0.5 text-[10px] font-bold text-binu-muted">비우는 루틴, 누리는 하루</div>
            </div>
          </div>
          <Button className="relative" variant="quiet" size="icon-lg" type="button" aria-label="알림" onClick={openNotification}>
            {hasUnreadNotification ? <span className="absolute right-2 top-2 size-2 rounded-full border-2 border-white bg-[#D96A67]" /> : null}
            <Bell size={21} aria-hidden="true" />
          </Button>
        </header>

        <main className="absolute inset-x-0 bottom-[calc(72px+env(safe-area-inset-bottom,0px))] top-[74px] overflow-hidden">
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
                    <div className="grid gap-4">{saved.map((item) => <SelectionCard key={item.id} item={item} saved onToggleSave={toggleSave} onDetail={openSelectionDetail} />)}</div>
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

        <nav className="absolute inset-x-0 bottom-0 z-50 grid h-[calc(72px+env(safe-area-inset-bottom,0px))] grid-cols-4 border-t border-binu-line bg-white/95 px-2 pb-[env(safe-area-inset-bottom,0px)] pt-1.5 backdrop-blur-xl" aria-label="하단 네비게이션">
          {navigationItems.map(({ key, label, icon: Icon }) => {
            const isActive = view === key || (view === "community-detail" && key === "community");
            return (
              <button
                key={key}
                className={cn(
                  "relative grid place-items-center content-center gap-1 rounded-lg text-[10px] font-bold text-binu-muted transition hover:bg-binu-sky-soft/60 hover:text-binu-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-binu-sky/50",
                  isActive && "font-black text-binu-navy before:absolute before:top-0 before:h-[3px] before:w-6 before:rounded-full before:bg-binu-sky",
                )}
                type="button"
                aria-current={isActive ? "page" : undefined}
                onClick={() => setView(key)}
              >
                <span className="grid place-items-center" aria-hidden="true"><Icon size={21} /></span>
                <span>{label}</span>
              </button>
            );
          })}
        </nav>

        {sheet ? (
          <div
            className="absolute inset-0 z-80 flex items-end bg-binu-ink/35 backdrop-blur-[4px] animate-in fade-in duration-200 md:rounded-[26px]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="sheetTitle"
            onClick={() => {
              setSheet(null);
              setCycleManagerEditing(false);
            }}
          >
            <section className="max-h-[86%] w-full overflow-hidden rounded-t-[18px] border border-b-white/80 bg-background shadow-[0_-20px_70px_rgba(23,32,42,0.18)] animate-in slide-in-from-bottom-4 duration-300" onClick={(event) => event.stopPropagation()}>
              <div className="mx-auto mt-2 h-1 w-10 rounded-full bg-binu-mist" />
              <header className="flex items-start justify-between gap-3 border-b border-binu-line bg-white/90 px-5 pb-3 pt-2">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-binu-muted">{sheet.step}</p>
                  <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-binu-ink" id="sheetTitle">{sheet.title}</h2>
                  {sheet.sub ? <p className="mt-1 max-w-[250px] text-[10px] font-medium leading-5 text-binu-muted">{sheet.sub}</p> : null}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  {sheet.kind === "cycleManager" ? (
                    cycleManagerEditing ? (
                      <>
                        <Button variant="ghost" size="sm" type="button" onClick={cancelCycleEditing}>취소</Button>
                        <Button variant="binu" size="sm" type="button" disabled={cycleSaving} onClick={saveCycleEditing}>
                          {cycleSaving ? "저장 중" : "저장"}
                        </Button>
                      </>
                    ) : (
                      <Button variant="binu" size="sm" type="button" onClick={startCycleEditing}>주기 수정하기</Button>
                    )
                  ) : null}
                  <Button
                    variant="quiet"
                    size="icon-lg"
                    type="button"
                    aria-label="닫기"
                    onClick={() => {
                      setSheet(null);
                      setCycleManagerEditing(false);
                    }}
                  >
                    <X size={20} aria-hidden="true" />
                  </Button>
                </div>
              </header>
              <div className="max-h-[calc(86dvh-92px)] overflow-y-auto px-5 pb-[calc(1.5rem+env(safe-area-inset-bottom,0px))] pt-4">
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
          <div className="absolute bottom-[calc(82px+env(safe-area-inset-bottom,0px))] left-1/2 z-100 grid w-[calc(100%-2.5rem)] max-w-[360px] -translate-x-1/2 grid-cols-[auto_1fr] items-center gap-3 rounded-lg border border-white/20 bg-binu-navy/95 px-4 py-3 text-white shadow-[0_18px_50px_rgba(23,32,42,0.22)] backdrop-blur-xl animate-in fade-in slide-in-from-bottom-2" role="status" aria-live="polite">
            <CheckCircle2 size={20} aria-hidden="true" />
            <div>
              <strong className="block text-xs font-extrabold">{toast.title}</strong>
              {toast.desc ? <small className="mt-1 block text-[10px] text-white/70">{toast.desc}</small> : null}
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
    <section className="view h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Card className="relative overflow-hidden border-binu-line bg-[linear-gradient(145deg,#E7F1FB_0%,#FFFFFF_58%,#FFF7F0_100%)] shadow-[0_18px_50px_rgba(46,75,102,0.08)]">
        <div className="pointer-events-none absolute -bottom-16 -right-10 size-36 rounded-full border-[24px] border-binu-sky/20" />
        <CardContent className="relative grid grid-cols-[1fr_auto] gap-4 py-2">
          <div>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-binu-muted">2026년 7월 10일 금요일</p>
            <h1 className="mt-3 text-[27px] font-black leading-[1.25] tracking-[-0.04em] text-binu-ink">보송님, 오늘은<br />여기만 봐도 충분해요</h1>
            <p className="mt-3 text-[13px] font-medium leading-6 text-binu-text">{syncState === "loading" || syncState === "error" ? syncMessage : "다 한 일은 했어요만 눌러주세요. 다음 주기는 제가 기억할게요."}</p>
          </div>
          <div className="grid size-14 place-items-center self-start rounded-lg border border-white bg-white/80 text-binu-navy shadow-sm">
            <div className="text-center"><strong className="block text-xl font-black leading-none">10</strong><span className="mt-1 block text-[10px] font-extrabold">금</span></div>
          </div>
        </CardContent>
      </Card>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <InfoTile value={categories.length} label="관리 중인 주기" />
        <InfoTile value={weeklyDone} label="최근 7일 완료" />
        <InfoTile value={nearest ? statusDateLabel(categoryStatus(nearest).days) : "-"} label={nearest ? `${nearest.name} 다음 관리` : "주기 관리에서 켜기"} />
        <InfoTile value={dueCount} label="오늘 기준 항목" />
      </div>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-binu-muted">Routine</span>
            <h2 className="mt-1 text-xl font-black tracking-[-0.03em] text-binu-ink">오늘의 홈케어</h2>
          </div>
          <Button variant="quiet" size="sm" type="button" onClick={onManageCycle}>
            <Settings2 size={15} aria-hidden="true" />
            주기 관리
          </Button>
        </div>
        <div className="grid gap-4">
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

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">최근 완료</h2>
          <span className="text-xs font-bold text-binu-muted">최신순</span>
        </div>
        <div className="-mx-5 flex snap-x gap-2 overflow-x-auto px-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          {logs.slice(0, 5).map((log) => (
            <Card className="min-w-28 snap-start border-binu-line bg-white shadow-none" key={log.id}>
              <CardContent>
              <IconTile icon={log.icon} size={34} />
              <strong className="mt-3 block text-xs font-extrabold text-binu-ink">{log.categoryName}</strong>
              <span className="mt-1 block text-[10px] font-bold text-binu-muted">{fmtDate(log.date)}</span>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">인기 비누 픽</h2>
          <span className="text-xs font-bold text-binu-muted">많이 본 추천</span>
        </div>
        <div className="grid gap-2">
          {popularSelections.map((item) => (
            <button className="grid w-full grid-cols-[34px_1fr_auto] items-center gap-3 rounded-lg border border-binu-line bg-white p-3 text-left transition hover:border-binu-sky hover:bg-binu-sky-soft/40" key={item.id} type="button" onClick={() => onOpenSelection(item.category)}>
              <IconTile icon={item.icon} size={34} />
              <div className="min-w-0">
                <strong className="block truncate text-xs font-extrabold text-binu-ink">{item.title}</strong>
                <span className="mt-1 block truncate text-[10px] font-bold text-binu-muted">{item.category} · {item.price}</span>
              </div>
              <ChevronRight className="size-4 text-binu-navy" aria-hidden="true" />
            </button>
          ))}
        </div>
      </section>

      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">인기 커뮤니티</h2>
          <span className="text-xs font-bold text-binu-muted">도움 받은 글</span>
        </div>
        <div className="grid gap-2">
          {popularPosts.map((post) => (
            <button className="grid w-full grid-cols-[34px_1fr_auto] items-center gap-3 rounded-lg border border-binu-line bg-white p-3 text-left transition hover:border-binu-sky hover:bg-binu-sky-soft/40" key={post.id} type="button" onClick={() => onOpenCommunity(post)}>
              <IconTile icon={post.icon} size={34} />
              <div className="min-w-0">
                <strong className="block truncate text-xs font-extrabold text-binu-ink">{post.title}</strong>
                <span className="mt-1 block truncate text-[10px] font-bold text-binu-muted">{post.authored ? "내 글" : post.category} · 도움 {post.helpful}</span>
              </div>
              <ChevronRight className="size-4 text-binu-navy" aria-hidden="true" />
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
  const statusTone = status.key === "doneToday" ? "done" : status.key === "good" ? "good" : status.key === "soon" ? "soon" : "due";
  const progress = status.key === "doneToday"
    ? 8
    : Math.min(100, Math.max(12, ((category.cycleDays - status.days) / category.cycleDays) * 100));
  return (
    <RoutineCard
      className="shadow-[0_18px_50px_rgba(46,75,102,0.08)]"
      title={category.name}
      description={category.note}
      schedule={`마지막 ${fmtDate(category.lastDoneAt)} · ${category.cycleDays}일 주기 · 다음 ${fmtDate(nextDate(category))}`}
      progress={progress}
      status={statusTone}
      statusLabel={`${status.label} · ${statusDateLabel(status.days)}`}
      actionLabel="했어요"
      secondaryLabel="도움 보기"
      iconSrc={iconPath(category.icon)}
      busy={busy}
      onAction={() => onComplete(category.id)}
      onSecondaryAction={() => onHelp(category.category)}
    />
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
    <section className="view h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Card className="relative overflow-hidden border-binu-line bg-[linear-gradient(145deg,#FFF7F0_0%,#FFFFFF_72%)] shadow-[0_18px_50px_rgba(46,75,102,0.08)]">
        <CardContent>
          <div className="grid size-11 place-items-center rounded-lg border border-binu-line bg-white text-binu-navy shadow-sm" aria-hidden="true"><Sparkles className="size-5" /></div>
          <p className="mt-5 text-[11px] font-extrabold uppercase tracking-[0.12em] text-binu-muted">Binu Pick · 상황별로 고른 선택지</p>
          <h1 className="mt-3 text-[29px] font-black leading-[1.2] tracking-[-0.04em] text-binu-ink">검색은 비우고,<br />선택은 가볍게.</h1>
          <p className="mt-3 text-sm font-medium leading-7 text-binu-text">용도와 주의점, 가격과 후기를 한눈에 비교해 지금 필요한 선택지를 빠르게 좁혀보세요.</p>
        </CardContent>
      </Card>
      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((item) => (
          <Button className="shrink-0 rounded-full" variant={filter === item ? "binu" : "quiet"} size="sm" key={item} type="button" onClick={() => onFilter(item)}>
            {item}
          </Button>
        ))}
      </div>
      <div className="mt-4 grid gap-4">
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
  if (item.type === "service") {
    return (
      <ServiceCard
        title={item.title}
        description={item.summary}
        price={item.price}
        region={item.fitFor}
        review={`후기 ${item.reviews}개`}
        rating={item.rating}
        source={item.source}
        tags={item.tags}
        saved={saved}
        onSave={() => onToggleSave(item.id)}
        onOpen={() => onDetail(item)}
      />
    );
  }

  return (
    <BinuPickCard
      className={cn(item.highlight && "border-binu-sky")}
      title={item.title}
      description={item.summary}
      price={item.price}
      rating={`${item.rating} · 후기 ${item.reviews}`}
      source={`${item.category} · ${item.source}`}
      imageSrc={item.image}
      tags={item.tags}
      saved={saved}
      saveLabel="비누 노트"
      openLabel="자세히 보기"
      onSave={() => onToggleSave(item.id)}
      onOpen={() => onDetail(item)}
    />
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
    <section className="view h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Card className="border-binu-line bg-[linear-gradient(145deg,#FFFFFF_40%,#E7F1FB_100%)] shadow-[0_18px_50px_rgba(46,75,102,0.08)]">
        <CardContent>
          <p className="text-[11px] font-extrabold uppercase tracking-[0.14em] text-binu-muted">Community</p>
          <h1 className="mt-3 text-[27px] font-black leading-[1.25] tracking-[-0.04em] text-binu-ink">막히는 청소 문제는<br />함께 해결해요</h1>
          <p className="mt-3 text-sm font-medium leading-7 text-binu-text">직접 글을 남기고, 검토된 Q&amp;A는 꿀팁으로 다시 정리됩니다.</p>
        </CardContent>
      </Card>
      <div className="mt-3 grid grid-cols-2 gap-1 rounded-lg border border-binu-line bg-white p-1" role="tablist" aria-label="커뮤니티 분류">
        <Button className="w-full" variant={tab === "tips" ? "binu-soft" : "ghost"} role="tab" aria-selected={tab === "tips"} type="button" onClick={() => onTab("tips")}>꿀팁 공유</Button>
        <Button className="w-full" variant={tab === "qa" ? "binu-soft" : "ghost"} role="tab" aria-selected={tab === "qa"} type="button" onClick={() => onTab("qa")}>Q&amp;A</Button>
      </div>
      <Card className="mt-3 border-[#F6DDC5] bg-binu-cream shadow-none">
        <CardContent className="flex items-center justify-between gap-3">
          <p className="text-xs font-medium leading-5 text-binu-text">{tab === "qa" ? "좋은 답변이 붙은 Q&A는 관리자가 꿀팁 공유로 옮겨요." : "경험 기반 팁을 카테고리별로 공유할 수 있어요."}</p>
          <Button className="shrink-0" variant="binu" size="sm" type="button" onClick={() => onWrite(tab)}>
          <PenLine size={16} aria-hidden="true" />
          {tab === "qa" ? "질문하기" : "팁 쓰기"}
          </Button>
        </CardContent>
      </Card>
      <div className="-mx-5 mt-4 flex gap-2 overflow-x-auto px-5 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {filters.map((item) => (
          <Button className="shrink-0 rounded-full" variant={categoryFilter === item ? "binu" : "quiet"} size="sm" key={item} type="button" onClick={() => onCategoryFilter(item)}>
            {item}
          </Button>
        ))}
      </div>
      <div className="mt-4 grid gap-3">
        {visiblePosts.length ? visiblePosts.map((post) => (
          <button className="w-full rounded-lg border border-binu-line bg-white p-4 text-left shadow-[0_14px_38px_rgba(46,75,102,0.06)] transition hover:border-binu-sky hover:shadow-[0_18px_42px_rgba(46,75,102,0.10)]" key={post.id} type="button" onClick={() => onOpen(post.id)}>
            <div className="grid grid-cols-[48px_1fr] gap-3">
              <IconTile icon={post.icon} />
              <div className="min-w-0">
                <span className="inline-flex rounded-full border border-binu-line bg-binu-sky-soft px-2 py-1 text-[10px] font-extrabold text-binu-navy">{post.authored ? "내 글" : tab === "qa" ? "Q&A" : "꿀팁"}</span>
                <h3 className="mt-2 text-[15px] font-extrabold leading-6 text-binu-ink">{post.title}</h3>
                <p className="mt-1 text-[10px] font-bold leading-5 text-binu-muted">{post.category} · #{post.tag} · {post.level} · {post.time} · 도움 {post.helpful}</p>
              </div>
            </div>
            <p className="mt-4 text-xs font-medium leading-6 text-binu-text">{post.body}</p>
            <span className="mt-4 inline-flex items-center gap-1 text-xs font-extrabold text-binu-navy">읽어보기 <ChevronRight size={15} aria-hidden="true" /></span>
          </button>
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
    <section className="view h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Button variant="ghost" size="sm" type="button" onClick={onBack}><ChevronLeft size={18} aria-hidden="true" />커뮤니티</Button>
      <Card className="mt-2 border-binu-line bg-white shadow-[0_18px_50px_rgba(46,75,102,0.08)]">
        <CardHeader>
          <div className="grid grid-cols-[48px_1fr] gap-3">
          <IconTile icon={post.icon} />
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-binu-muted">커뮤니티 · {post.category}</p>
            <h1 className="mt-2 text-xl font-black leading-7 tracking-[-0.03em] text-binu-ink">{post.title}</h1>
            <p className="mt-2 text-[10px] font-bold leading-5 text-binu-muted">{post.level} · {post.time} · 도움 {post.helpful} · 저장 {post.saved} · {kind === "qa" ? "답글" : "댓글"} {post.comments}</p>
          </div>
          </div>
        </CardHeader>
        <CardContent>
        <Separator className="mb-4 bg-binu-line" />
        <div className="flex gap-2">
          <Button variant={post.helpedByMe ? "binu-soft" : "quiet"} size="sm" type="button" onClick={onHelpful}>
            <ThumbsUp size={16} aria-hidden="true" />
            도움 {post.helpful}
          </Button>
          <Button variant={post.savedByMe ? "binu-soft" : "quiet"} size="sm" type="button" onClick={onSave}>
            {post.savedByMe ? <BookmarkCheck size={16} aria-hidden="true" /> : <Bookmark size={16} aria-hidden="true" />}
            {post.savedByMe ? "저장됨" : "저장"} {post.saved}
          </Button>
        </div>
        <InfoBlock title="요약">{post.body}</InfoBlock>
        <Card size="sm" className="mt-3 border-binu-line bg-background shadow-none">
          <CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">진행 순서</CardTitle></CardHeader>
          <CardContent><ol className="list-decimal space-y-1 pl-4 text-xs leading-6 text-binu-text">{post.steps.map((step) => <li key={step}>{step}</li>)}</ol></CardContent>
        </Card>
        <InfoBlock title="확인 필요">{post.safety} 관련 내용은 재질과 제품 표기를 먼저 확인하세요.</InfoBlock>
        <Card size="sm" className="mt-3 border-binu-line bg-background shadow-none">
          <CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">{kind === "qa" ? "답글과 답변" : "댓글"}</CardTitle></CardHeader>
          <CardContent>
          <form
            className="grid grid-cols-[1fr_auto] gap-2"
            onSubmit={(event) => {
              event.preventDefault();
              const form = new FormData(event.currentTarget);
              onReply(String(form.get("reply") || ""));
              event.currentTarget.reset();
            }}
          >
            <Input className="h-9 bg-white" name="reply" placeholder={kind === "qa" ? "답글을 남겨주세요" : "댓글을 남겨주세요"} />
            <Button variant="binu" type="submit" aria-label={kind === "qa" ? "답글 등록" : "댓글 등록"}>
              <Send size={16} aria-hidden="true" />
              {kind === "qa" ? "답글" : "댓글"}
            </Button>
          </form>
          <div className="mt-3 grid gap-2">{post.answers.map((answer) => <p className="rounded-lg border border-binu-line bg-white px-3 py-2 text-xs leading-6 text-binu-text" key={answer}>{answer}</p>)}</div>
          </CardContent>
        </Card>
        <Card size="sm" className="mt-3 border-binu-line bg-background shadow-none">
          <CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">관련 비누 픽</CardTitle></CardHeader>
          <CardContent>
          {relatedSelections.length ? (
            <div className="grid gap-2">
              {relatedSelections.map((item) => (
                <button className="grid w-full grid-cols-[34px_1fr_auto_auto] items-center gap-2 rounded-lg border border-binu-line bg-white p-2 text-left" key={item.id} type="button" onClick={onOpenSelection}>
                  <IconTile icon={item.icon} size={34} />
                  <span className="truncate text-[11px] font-bold text-binu-ink">{item.title}</span>
                  <strong className="text-[10px] font-extrabold text-binu-navy">{item.price}</strong>
                  <ChevronRight className="size-4 text-binu-muted" aria-hidden="true" />
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs leading-6 text-binu-text">아직 연결된 상품이나 서비스가 없습니다.</p>
          )}
          </CardContent>
        </Card>
        </CardContent>
      </Card>
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
    <section className="view h-full overflow-y-auto px-5 pb-8 pt-5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <Card className="border-binu-line bg-[linear-gradient(145deg,#E7F1FB_0%,#FFFFFF_72%)] shadow-[0_18px_50px_rgba(46,75,102,0.08)]">
        <CardContent className="grid grid-cols-[60px_1fr] items-center gap-4">
          <div className="grid size-15 place-items-center rounded-full border-4 border-white bg-binu-sky text-lg font-black text-binu-navy shadow-sm">보</div>
          <div>
            <p className="text-[10px] font-extrabold uppercase tracking-[0.16em] text-binu-muted">My Binu</p>
            <h1 className="mt-2 text-xl font-black tracking-[-0.03em] text-binu-ink">보송님의 비누 기록</h1>
            <p className="mt-2 text-xs font-medium leading-6 text-binu-text">완벽하지 않아도 괜찮아요. 다시 시작한 작은 기록까지 모아둘게요.</p>
          </div>
        </CardContent>
      </Card>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <InfoTile value={logs.length} label="이번 달 완료" />
        <InfoTile value={categories.length} label="사용 중인 주기" />
        <InfoTile value={savedCount} label="담은 셀렉션" />
        <InfoTile value={savedCommunityPosts.length} label="저장한 글" />
      </div>
      <section className="mt-9">
        <div className="mb-4 flex items-end justify-between gap-3">
          <h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">최근 12주</h2>
          <span className="text-xs font-bold text-binu-muted">주간 완료 기록</span>
        </div>
        <Card className="border-binu-line bg-white shadow-none">
          <CardContent className="grid grid-cols-12 gap-1.5">
            {levels.map((level, index) => (
              <span
                className={cn(
                  "aspect-square rounded-[4px] bg-binu-mist",
                  level === 1 && "bg-[#D8ECF9]",
                  level === 2 && "bg-binu-sky",
                  level === 3 && "bg-binu-navy",
                  index === levels.length - 1 && "outline-2 outline-offset-2 outline-binu-navy",
                )}
                key={`${level}-${index}`}
              />
            ))}
          </CardContent>
        </Card>
      </section>
      <section className="mt-9">
        <div className="mb-4"><h2 className="text-xl font-black tracking-[-0.03em] text-binu-ink">비누 노트와 설정</h2></div>
        <Card className="gap-0 border-binu-line bg-white py-0 shadow-none">
          <MenuRow icon={History} label="비누 기록" detail={`이번 달 ${logs.length}개`} onClick={onHistory} />
          <MenuRow icon={BookmarkCheck} label="저장한 비누 픽" detail={`${savedCount}개 담김`} onClick={onSaved} />
          <MenuRow icon={MessageSquareHeart} label="저장한 커뮤니티" detail={`${savedCommunityPosts.length}개 저장`} onClick={onSavedCommunity} />
          <MenuRow icon={PenLine} label="내 커뮤니티 글" detail={`${authoredCommunityPosts.length}개 작성`} onClick={onAuthoredCommunity} />
          <MenuRow icon={CalendarClock} label="주기 관리" detail={`${categories.length}개 사용 중`} onClick={onManageCycle} />
          <MenuRow icon={Bell} label="알림 설정" detail="조용한 알림" />
        </Card>
      </section>
    </section>
  );
}

function MenuRow({
  icon: Icon,
  label,
  detail,
  onClick,
}: {
  icon: typeof History;
  label: string;
  detail: string;
  onClick?: () => void;
}) {
  return (
    <button className="grid min-h-14 w-full grid-cols-[34px_1fr_auto_auto] items-center gap-3 border-b border-binu-line px-3 py-2 text-left transition last:border-b-0 hover:bg-binu-sky-soft/50" type="button" onClick={onClick}>
      <span className="grid size-[34px] place-items-center rounded-lg bg-binu-sky-soft text-binu-navy" aria-hidden="true"><Icon size={18} /></span>
      <span className="text-xs font-extrabold text-binu-ink">{label}</span>
      <strong className="text-[10px] font-bold text-binu-muted">{detail}</strong>
      <ChevronRight className="size-4 text-binu-muted" aria-hidden="true" />
    </button>
  );
}

function InfoTile({ value, label }: { value: string | number; label: string }) {
  return (
    <Card className="min-h-20 border-binu-line bg-white shadow-none">
      <CardContent className="flex h-full flex-col justify-between">
        <strong className="block truncate text-lg font-black text-binu-navy">{value}</strong>
        <span className="mt-2 block text-[10px] font-bold leading-4 text-binu-muted">{label}</span>
      </CardContent>
    </Card>
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
    <div className="grid gap-3">
      {presets.map((preset) => {
        const activeCategory = findCategoryForPreset(preset, categories);
        const draftItem = draft[preset.id];
        const enabled = editing ? Boolean(draftItem?.enabled) : Boolean(activeCategory);
        const cycleDays = editing ? draftItem?.cycleDays ?? preset.defaultCycle : activeCategory?.cycleDays ?? preset.defaultCycle;
        const canChangeCycle = editing && enabled && !saving;
        const canToggle = editing && !activeCategory && !saving;
        return (
          <Card className={cn("border-binu-line bg-white shadow-none", enabled && "border-binu-sky bg-[linear-gradient(135deg,#FFFFFF,#E7F1FB)]")} key={preset.id}>
            <CardContent className="grid grid-cols-[42px_1fr_auto] items-start gap-3">
              <IconTile icon={preset.icon} size={42} />
              <div className="min-w-0">
              <strong className="block text-sm font-extrabold text-binu-ink">{preset.name}</strong>
              <span className="mt-1 block text-[10px] font-medium leading-5 text-binu-muted">{activeCategory ? "서버에 저장됨" : enabled ? "저장하면 새 주기로 추가됨" : "아직 추가되지 않음"} · {cycleDays}일 주기 · {preset.note}</span>
              {editing ? (
                <div className="mt-3 grid grid-cols-[28px_1fr_28px] items-center gap-1.5">
                  <Button variant="quiet" size="icon-sm" type="button" aria-label={`${preset.name} 주기 줄이기`} disabled={!canChangeCycle || cycleDays === ALLOWED_CYCLE_DAYS[0]} onClick={() => onCycleChange(preset.id, stepCycleDays(cycleDays, -1))}>
                    <Minus size={15} aria-hidden="true" />
                  </Button>
                  <div className="grid grid-cols-5 gap-1" role="group" aria-label={`${preset.name} 주기 선택`}>
                    {ALLOWED_CYCLE_DAYS.map((days) => (
                      <Button
                        key={days}
                        className="px-0"
                        variant={days === cycleDays ? "binu" : "quiet"}
                        size="icon-sm"
                        type="button"
                        disabled={!canChangeCycle}
                        onClick={() => onCycleChange(preset.id, days)}
                      >
                        {days}
                      </Button>
                    ))}
                  </div>
                  <Button variant="quiet" size="icon-sm" type="button" aria-label={`${preset.name} 주기 늘리기`} disabled={!canChangeCycle || cycleDays === ALLOWED_CYCLE_DAYS[ALLOWED_CYCLE_DAYS.length - 1]} onClick={() => onCycleChange(preset.id, stepCycleDays(cycleDays, 1))}>
                    <Plus size={15} aria-hidden="true" />
                  </Button>
                </div>
              ) : null}
            </div>
            <button
              className={cn("relative h-[22px] w-[38px] rounded-full bg-binu-mist transition disabled:opacity-70", enabled && "bg-binu-navy")}
              type="button"
              role="switch"
              aria-checked={enabled}
              aria-label={`${preset.name} 주기 ${activeCategory ? "사용 중" : enabled ? "추가 취소" : "추가"}`}
              disabled={!canToggle}
              onClick={() => onToggle(preset.id)}
            >
              <span className={cn("absolute left-[3px] top-[3px] size-4 rounded-full bg-white shadow-sm transition", enabled && "translate-x-4")} />
            </button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}

function InfoBlock({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <Card size="sm" className="mt-3 border-binu-line bg-background shadow-none">
      <CardHeader><CardTitle className="text-xs font-extrabold text-binu-navy">{title}</CardTitle></CardHeader>
      <CardContent><p className="text-xs leading-6 text-binu-text">{children}</p></CardContent>
    </Card>
  );
}

function DetailMetric({ label, value, icon }: { label: string; value: string; icon?: React.ReactNode }) {
  return (
    <Card size="sm" className="border-binu-line bg-white shadow-none">
      <CardContent className="min-w-0">
        <span className="block text-[9px] font-bold text-binu-muted">{label}</span>
        <strong className="mt-1 flex items-center gap-1 truncate text-[10px] font-extrabold text-binu-navy">{icon}{value}</strong>
      </CardContent>
    </Card>
  );
}

function HistoryList({ logs }: { logs: Log[] }) {
  return (
    <div className="grid gap-3">
      {logs.map((log) => (
        <Card className="border-binu-line bg-white shadow-none" key={log.id}>
          <CardContent className="grid grid-cols-[42px_1fr] items-center gap-3">
            <IconTile icon={log.icon} size={42} />
            <div className="min-w-0">
              <strong className="block text-xs font-extrabold text-binu-ink">{log.categoryName}</strong>
              <span className="mt-1 block text-[10px] font-bold text-binu-muted">{fmtDate(log.date)} · {log.method}</span>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function CommunityPostList({ posts, onOpen }: { posts: CommunityPost[]; onOpen: (post: CommunityPost) => void }) {
  return (
    <div className="grid gap-3">
      {posts.map((post) => (
        <button className="grid w-full grid-cols-[40px_1fr] items-center gap-3 rounded-lg border border-binu-line bg-white p-3 text-left transition hover:border-binu-sky hover:bg-binu-sky-soft/40" key={post.id} type="button" onClick={() => onOpen(post)}>
          <IconTile icon={post.icon} size={40} />
          <div className="min-w-0">
            <strong className="block truncate text-xs font-extrabold text-binu-ink">{post.title}</strong>
            <span className="mt-1 block text-[10px] font-bold text-binu-muted">{post.category} · 도움 {post.helpful} · 저장 {post.saved}</span>
          </div>
        </button>
      ))}
    </div>
  );
}

function EmptyState({ title, desc }: { title: string; desc: string }) {
  return <BinuEmptyState title={title} description={desc} actionLabel={null} />;
}
